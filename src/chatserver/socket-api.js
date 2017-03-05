import { Socket } from 'phoenix-elixir'
import router from '../router'
import store from '../store'
import { socketURL } from '../chatserver'
import uniqueId from 'uniqid'

// define the socket per user: anonymous, user_id
export let socket = new Socket(socketURL)

/*
  To make it clean, I have three separate channels [User, Pingal, Room] to talk to Phoenix
  I am also adding a fourth "World" channel to see what everyone is talking to Pingal
  Idea: Users talk to pingal publicly till they are logged in.
*/
let DEFAULT_LOBBY = 'pingal:lobby'

/*
  internal functions
*/

let isSlideInStore = (slideId) => {
  return store.getters.slides.find(slide => slide._id === slideId)
}

let isCurrentSlide = (slideId) => {
  const currentSlide = store.getters.currentSlide
  return currentSlide && currentSlide._id === slideId
}

let joinRoom = (roomName = DEFAULT_LOBBY, params = {}) => {
  const room = socket.channel(roomName, params)

  room.join()
    .receive('ok', _ => {
      console.log('joined succesfully to pingal:lobby')
    })
    .receive('error', resp => {
      console.log(`Unable to join ${resp} `)
    })
    .receive('timeout', _ => {
      console.log('Check all connections: network, database, ...')
    })

    // add some room-level event handlers
  room.onError(event => console.log('Room error.', event))
  room.onClose(event => console.log('Room closed.'))

  return room
}

export let sendToChannel = (room, slides, event = 'add:slide') => {
  console.log('sending to room...')
  room.push(event, slides)
        .receive('ok', (msg) => console.log('sent'))
        .receive('error', (reasons) => console.log('failed', reasons))
}

export let joinUserChannel = ({ id, jwt }) => {
  let userChannel = socket.channel(`users:${id}`, { token: jwt })

  userChannel.join()
    .receive('ok', (msg) => console.log('user joined'))
  return userChannel
}

export let joinWorldChannel = () => {
  let roomChannel = joinRoom(DEFAULT_LOBBY)

  roomChannel.on('get:slides_in_room', (slides) => {
    store.commit('APPEND_SLIDES', slides)
  })

  roomChannel.on('add:slide', (slide) => {
    store.commit('APPEND_SLIDE', slide)
  })

  return roomChannel
}

export let joinPingalChannel = ({ userId, jwt }) => {
  let roomChannel = joinRoom(`pingal:${userId}`, { token: jwt })

  roomChannel.on('get:slides_in_room', (slides) => {
    store.commit('APPEND_SLIDES', slides)
  })

  roomChannel.on('add:slide', (slide) => {
    store.commit('APPEND_SLIDE', slide)
  })

  return roomChannel
}

export let joinRoomChannel = ({roomId}) => {
  let roomChannel = joinRoom(`rooms:${roomId}`, {})

  roomChannel.on('get:slides_in_room', (slides) => {
    store.commit('APPEND_SLIDES', slides)
  })

  roomChannel.on('add:slide', slide => {
    store.commit('APPEND_SLIDE', slide)
  })

  return roomChannel
}
