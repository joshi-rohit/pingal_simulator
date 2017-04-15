import Vue from 'vue'
import Vuex from 'vuex'
import actions from './actions'
import mutations from './mutations'
import Cookies from 'js-cookie'
import {
  joinWorldChannel, 
  joinPingalChannel
} from '@/chatserver'

// import connections from './room_users_data'

Vue.use(Vuex)

// Load cookie data
let user = Cookies.get('user');
user = user ? JSON.parse(user) : null;

let jwt = Cookies.get('jwt');
jwt = jwt ? jwt : null;

let session = Cookies.get('session');

// Load current room as pings channel
let currentRoomChannel = jwt ? joinPingalChannel(user.id) : joinWorldChannel(session)

// contains the state of entire app
const state = {
  currentSlide: {},
  currentUser: user,
  currentRoom: {name: "Pingal"},
  currentRoomChannel: currentRoomChannel,
  currentRoomInputChannel: currentRoomChannel,
  currentInput: {text: '', focus: 1},
  connections: [],
  showRight: false,
  showLeft: true,
  slides: [],
  session: session,
  rooms: [],
  jwt: jwt,
  placeholder: "Type a Message",
  bot: "dialog"
}


/*
 Getters are like computed properties for stores.
 We can compute derived state based on store state.
 The getters will be exposed on the store.getters object
*/

const getters = {
   slides: (state) => state.slides,
   currentSlide: (state) => state.currentSlide,
   getSlidesCount: (state) => state.slides.length,

   rooms: (state) => state.rooms,
   currentRoom: (state) => state.currentRoom,
   currentRoomChannel: (state) => state.currentRoomChannel,
   currentRoomInputChannel: (state) => state.currentRoomInputChannel,
   getRoomsCount: (state) => state.rooms.length,

   currentUser: (state) => state.currentUser,
   connections: (state) => state.connections,

   placeholder: (state) => state.placeholder,
	 bot: (state) => state.bot,

   getBrain: (state) => { 
     let brain = (state.currentSlide.isPingal && state.currentSlide.brain) ? state.currentSlide.brain : {}
     return brain
   },

   hasIndex: (state) => {
     let brain = (state.currentSlide.isPingal && state.currentSlide.brain) ? state.currentSlide.brain : {}
      return brain && brain.index_terms && brain.index_terms.length > 0
   },

	 getIndex: (state) => {
        let brain = (state.currentSlide.isPingal && state.currentSlide.brain) ? state.currentSlide.brain : {}
        let first_obj = (brain && brain.index_terms) ? brain.index_terms[0] : {}
        let key = first_obj && Object.keys(first_obj)[0]
        // Make first index the key itself if not already
        let index = []
        if (key) {
          index = key == first_obj[key][0] ? first_obj[key] : [key].concat(first_obj[key]) 
        }    
        return index
			},
	
    getKeyPhrase() {
          let brain = (state.currentSlide.isPingal && state.currentSlide.brain) ? state.currentSlide.brain : {}
          let first_obj = (brain && brain.index_terms) ? brain.index_terms[0] : {}
          return first_obj && Object.keys(first_obj)[0]
    },
	
    recallMemory(){
       let brain = (state.currentSlide.isPingal && state.currentSlide.brain) ? state.currentSlide.brain : {}
       return brain && brain.text
    }

}

const store = new Vuex.Store({
  // strict: process.env.NODE_ENV !== 'production', // If can work, nice to use
  state,
  getters,
  mutations,
  actions
})

export default store