import router from '../router'
import store from '../store'
import {socket, closeSocket} from './socket-config'
import { Presence } from 'phoenix-elixir'

import _ from 'lodash'
/*
  To make it clean, I have three separate channels [User, Pingal, Room] to talk to Phoenix
  I am also adding a fourth "World" channel to see what everyone is talking to Pingal
  Idea: Users talk to pingal publicly till they are logged in.
*/

let DEFAULT_LOBBY = 'pings:lobby'

/*
  Internal Functions
*/

let isSlideInStore = (slideId) => {
  return store.getters.slides.find(slide => slide._id === slideId)
}

let isCurrentSlide = (slideId) => {
  const currentSlide = store.getters.currentSlide
  return currentSlide && currentSlide._id === slideId
}

let joinRoom = (roomName = DEFAULT_LOBBY, params = {}) => {
  // only join if not joined previously or the state is closed
  let room = _.find(socket.channels, (rm)=> rm.topic === roomName)
  //console.log(socket)
  if (!room) {
         room = socket.channel(roomName, params)
         //console.log("joined room")
         //console.log(room)
  }
  
  if (room.state === 'closed') {
    room.join()
      .receive('ok', _ => {
        console.log(`joined successfully to ${roomName}`)
      })
      .receive('error', resp => {
        console.log(`Unable to join ${resp} `)
      })
      .receive('timeout', _ => {
        console.log('Timeout: Check all connections: network, database, ...')
      })

    // add some room-level event handlers
    room.onError(event => console.log('Room error.', event))
    room.onClose(event => console.log('Room closed.'))
  }

  return room
}

let joinUser = (userId, params = {}) => {
  let userChannel = socket.channel("users:" + userId, params)

  if (userChannel.state === 'closed') {
    userChannel.join()
      .receive('ok', _ => {
        console.log(`joined successfully userChannel`)
      })
      .receive('error', resp => {
        console.log(`Unable to join userChannel ${resp}`)
      })
      .receive('timeout', _ => {
        console.log('Timeout: on userChannel: check connections, network, database, etc.')
      })

    userChannel.onError(event => console.log('User channel error', event))
    userChannel.onClose(event => console.log('User channel closed'))
  }

  return userChannel
}

/* Channel.on functions */

let addSlide = (slide, delay = 0) => {
  setTimeout(function() {
    // do not commit if slide is empty
    console.log("received")
    console.log(slide)

    if (slide.slide) {
      slide = slide.slide
    }
    
    if (('text' in slide) && (slide.text)) {
      store.commit('PREPEND_SLIDE', slide)
      store.commit('SET_CURRENT_SLIDE', slide)
    }
  }, delay)
} 

let appendSlide = (slide, delay = 0) => {
  setTimeout(function() {
    // do not commit if slide is empty
    console.log("received pingal slide")
    console.log(slide)

    if (slide.slide) {
      slide = slide.slide
    }
    
    if (('text' in slide) && (slide.text)) {
      store.commit('APPEND_SLIDE', slide)
      store.commit('SET_CURRENT_SLIDE', slide)
    }
  }, delay)
}

let addReply = ({slide}) => {
  store.commit('APPEND_REPLY', slide)
}

let addPresence = (slide) => {
    //console.log(slide)
    if ((!('text' in slide)) && ('joins' in slide)) {
      // joining or leaving event: 
        if (Object.keys(slide["joins"]).length > 0) {
          let first = slide["joins"]
          
          let u = first[Object.keys(first)[0]]
          let metas = u.metas[Object.keys(u.metas)[0]]
          //console.log(u)
          //slide.text = `Meet: ${u.user.name}, who is interested in ${metas.introduction} `
          //slide.isPingal = true
        } else {
          let first = slide["leaves"]
          let u = first[Object.keys(first)[0]]
          //slide.text = `User ${u.user.name} left`
          
      }
      
    }
    addSlide(slide)
}

let getSlidesInRoom = (data) => {
  //store.commit('SET_SLIDES', data.slides)
  store.commit('APPEND_SLIDES', data.slides)
}

let getUsersInRoom = (data) => {
  store.commit('SET_USERS', data.users)
}

// Direct object match responses

let addRooms = ({rooms}) => {
  store.commit('APPEND_ROOMS', rooms)
}

let setRooms = ({rooms}) => {
  console.log("setting rooms")
  store.commit('SET_ROOMS', rooms)
  joinAllChannels(rooms)
}

let addGroup = ({room}) => {
  addRooms({rooms: room})
  //store.commit('CLEAR_SLIDES')
  store.commit('SET_CURRENT_ROOM_CHANNEL', joinRoomChannel(room.id))
  store.commit('SET_CURRENT_ROOM_INPUT_CHANNEL', joinRoomInputChannel(room.id))
  store.commit('SET_CURRENT_ROOM', room)
  store.commit('SHOW_RIGHT')
  // Focus input
  store.commit('INPUT_FOCUS')
}

let addIntroduction = ({room}) => {
  addGroup({room})
}

let watch = ({room_id, user}) => {
  store.commit('WATCH', user)
}

let renderPresence = (presences) => {
  //console.log("Presence")
  const users_in_room = [];
  Presence.list(presences, (id, obj) => {
        return { 
            ...obj.user,
            room_id: obj.metas[0].room_id
          }})           
          .map(user => users_in_room.push(user));

  //console.log(users_in_room)
  store.commit('SET_USERS', users_in_room)
};

// Response:
const responseDelay = 100
let response = ({slide, topicRoom, introRoom}) => {
  //slide.type = 'suggestTopic'
  // slide.isPingal = true
  console.log("Name or Interest or Something Else (slide v)")
  console.log(slide)

  
  if (slide && "topicRoom" in slide ) {
    store.commit('SHOW_LEFT')
    addRoom(topicRoom)
    // is this deprecated?
  }
  else if (slide && slide.type === 'logOut') {
    store.commit('LOG_OUT')
  }
  else if (slide && slide.type === 'joinTopic') {
    console.log("join Topic room")
    store.commit('SHOW_LEFT')
    topicRoom['alert'] = true
    addRooms({rooms: topicRoom})
  }
  else if (slide && slide.type === 'intro') {
    console.log("intro person")
    store.commit('SHOW_LEFT')
    topicRoom['alert'] = true
    addRooms({rooms: introRoom})
  }

  appendSlide(slide, responseDelay)
  
}

/* 
  External Functions
*/
export let sendToChannel = (room, slide, event = 'add:slide') => {
  console.log('sending to room...');
  //console.log(slide)
  room.push(event, slide)
        .receive('ok', (msg) => console.log('sent'))
        .receive('error', (reasons) => console.log('failed', reasons))
}

// export let joinUserChannel = ({ id, jwt }) => {
//   let userChannel = socket.channel(`users:${id}`, { token: jwt })

//   userChannel.join()
//     .receive('ok', (msg) => console.log('user joined'))
//   return userChannel
// }

let notify = (data) => {
  console.log("notify")
  console.log(data)
}

export let joinUserChannel = (userId) => {
  let userChannel = joinUser(userId);
  
  userChannel.on('notify', notify)

  return userChannel
}

export let joinAllChannels = (rooms) => {
    // also join all user rooms automatically
  //console.log(rooms)
  //rooms.forEach((room) => joinRoomChannel(room.id))
  //rooms.forEach((room) => joinRoomInputChannel(room.id))
}

export let joinWorldChannel = (session) => {
  let path = DEFAULT_LOBBY + ":" + session

  let roomChannel = joinRoom(path)

  roomChannel.on('get:slides_in_room', getSlidesInRoom)

  // pingal response
  roomChannel.on('response:', response)
  roomChannel.on('response:name', response)
  roomChannel.on('response:interests', response)
  roomChannel.on('response:signUp', response)
  roomChannel.on('response:suggestTopic', response)
  roomChannel.on('response:logIn', response)
  roomChannel.on('response:joinTopic', response)
  roomChannel.on('response:logOut', response)
  roomChannel.on('response:planIntroduction', response)
  roomChannel.on('response:brain', response)
  roomChannel.on('response:dialogPingal', response)
  roomChannel.on('response:intro', response)

  // user text message
  roomChannel.on('add:slide', appendSlide)

  
  return roomChannel
}

export let joinPingalChannel = (userId) => { //, jwt 
  let roomChannel = joinRoom(`pings:user:${userId}`) //, { token: jwt } authenticating on socket directly instead

  roomChannel.on('get:slides_in_room', getSlidesInRoom)

  roomChannel.on('response:', response)
  roomChannel.on('response:signUp', response)
  roomChannel.on('response:suggestTopic', response)
  roomChannel.on('response:joinTopic', response)
  roomChannel.on('response:logIn', response)
  roomChannel.on('response:logOut', response)
  roomChannel.on('response:planIntroduction', response)
  roomChannel.on('response:brain', response)
  roomChannel.on('response:dialogPingal', response)
  roomChannel.on('response:intro', response)

  roomChannel.on('set:rooms', setRooms)
  roomChannel.on('add:rooms', addRooms)
  roomChannel.on('add:slide', appendSlide)

  roomChannel.on('reward', appendSlide)
  return roomChannel
}

export let joinRoomChannel = (roomId) => {
  let roomChannel = joinRoom(`rooms:${roomId}`, {})

  let presences = {}

  roomChannel.on('get:slides_in_room', getSlidesInRoom)
  //roomChannel.on('get:users_in_room', getUsersInRoom)

  roomChannel.on('add:slide', addSlide)
  roomChannel.on('add:reply', addReply)

  roomChannel.on('add:group', addGroup)
  roomChannel.on('add:introduction', addIntroduction)
  roomChannel.on('response:brain', response)
  roomChannel.on('response:dialogPingal', response)

  //roomChannel.on('watch', watch)
    // presence
  roomChannel.on("presence_state", state => {
      //console.log(state)
      presences = Presence.syncState(presences, state)
      //console.log(presences)
      renderPresence(presences)
  })
  
  roomChannel.on("presence_diff", diff => {
      presences = Presence.syncDiff(presences, diff)
      //console.log(presences)
      renderPresence(presences)
  })

  roomChannel.on('add:presence', addPresence)

  roomChannel.on('reward', addSlide)

  return roomChannel
}

export let joinRoomInputChannel = (roomId) => {
  let roomInputChannel = joinRoom(`rooms:input:${roomId}`, {})

  let presences = {}

    // presence
  roomInputChannel.on("presence_state", state => {
      //console.log(state)
      presences = Presence.syncState(presences, state)
      //console.log(presences)
      renderPresence(presences)
  })
  roomInputChannel.on("presence_diff", diff => {
      presences = Presence.syncDiff(presences, diff)
      //console.log(presences)
      renderPresence(presences)
  })
  return roomInputChannel
}

