import uniqueId from 'uniqid'
import {
  apiURL,
  sendToChannel,
  httpGet,
  httpPost,
  httpUpdate,
  httpDelete,
  joinUserChannel
} from '../chatserver'

let userChannel = null

/*
Store in Veux is immutable.

 Actions are separated from Mutations because:
  - actions are asynchronous. Multiple actions can be dispatched to the phoenix backend in async mode ;
  - whereas data mutations need to be synchronous like database transactions.
  if: the response status from phoenix is successful,
  then: commit the mutation to the store. We can log every commit if we want a debugger mode.

 This is a middleware layer. We can communicate to Phoenix using both HTTP(S) & WebSocket(ws or wss).

 store.dispatch : is an async action call
 store.commit : is a sync mutation call
*/

const actions = {

  /* START <SLIDE DISPATCH ACTION HANDLERS> */
  pushSlide ({ commit }, {room, slide, event}) {
    // channel endpoint : only push data; room.on() will receive the data
    console.log("pushed slide")
    return sendToChannel(room, slide, event)
       // .catch((error) => {
       //   error.response.json()
       //   .then((errorJSON) => {
       //      console.log('send error')
       //   })
       // })
  },

  signUp({ commit }, {email, password}) {
    console.log("signed up")
  },
  
  /* START <USER DISPATCH ACTION HANDLERS> */
  signIn ({ commit, dispatch }, session) {
      return httpPost(`${apiURL}/sessions`, { session })
      .then(({ jwt, user }) => {
          localStorage.setItem('id_token', jwt)
          userChannel = joinUserChannel({ id: user.id, jwt })
          commit('SET_CURRENT_USER', { ...user, jwt })
      })
      .catch((error) => {
          error.response.json()
          .then((errorJSON) => {
              console.log('signin error')
          })
      })
  },

  currentUser ({ commit }) {
    return httpGet(`${apiURL}/current_user`)
      .then(({ user }) => {
        const jwt = localStorage.getItem('id_token')
        userChannel = joinUserChannel({ id: user.id, jwt })
        commit('SET_CURRENT_USER', { ...user, jwt })
      })
  },

  /* START <ROOM DISPATCH ACTION HANDLERS> */
  updateCurrentRoom ({commit}, room) {
      commit('SET_CURRENT_ROOM', room.id)
  }

}

export default actions