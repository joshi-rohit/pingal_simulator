<template>
	<div>
		<div class="fb-login-button fb-custom-signup" data-max-rows="1" data-size="large" data-button-type="continue_with" data-show-faces="false" data-auto-logout-link="false" data-use-continue-as="true" 
		data-scope="public_profile,email" onlogin="FB.checkLoginState()"></div>

		<form novalidate @submit.stop.prevent="signUpEmail" class="signup-form">
			<span class="error-message">{{error}}</span>
			<span class="success-message""">{{success}}</span>
			<md-input-container>
		    <label>Full Name</label>
		    <md-input type="email" v-model="fullName"></md-input>
		  </md-input-container>
		  <md-input-container>
		    <label>Email</label>
		    <md-input type="email" v-model="email"></md-input>
		  </md-input-container>
<!-- 		  <md-input-container>
		    <label>Password</label>
		    <md-input type="password" v-model="password"></md-input>
		  </md-input-container>
		  <md-input-container>
		    <label>Password Confirmation</label>
		    <md-input type="password" v-model="passwordConfirmation"></md-input>
		  </md-input-container> -->
		  <md-button class="md-raised md-primary" type="submit">Sign Up</md-button>
		</form>
	</div>
</template>

<script>
	import fbReinitialize from '@/mixins/fbReinitialize'
	import { mapGetters, mapActions } from 'vuex'
	
	export default {
		mixins: [fbReinitialize],
		data() {
			return {
				fullName: '',
				email: '',
				password: '',
				passwordConfirmation: '',
				error: '',
				success: ''
			}
		},
		computed: {
			...mapGetters([
				'lastTopicSlide',
				'inputChannel'
			])
		},
		created() {
			this.fbReinitialize()
		},
		methods: {
			signUpEmail() {
				let [validated, errorMessage] = this.validateEmail()

				if (validated) {
					this.error = ''
					this.$store.dispatch('signUpEmail', {
						fullName: this.fullName,
						email: this.email
					})
					.then(() => {
						this.success = 'Success!'
						this.error = ''
						// Send last topic slide if exists
						if (this.lastTopicSlide) {
							this.$store.dispatch('pushSlide', {
								roomChannel: this.inputChannel,
		          	slide: this.lastTopicSlide, 
		          	event: 'request'
							})
						}
					})
				} else {
					this.success = ''
					this.error = errorMessage
				}
			},

			signUp() {
				let [validated, errorMessage] = this.validate()

				if (validated) {
					this.error = ''
					this.$store.dispatch('signUp', {
						email: this.email,
						password: this.password,
					})
					.then(() => {
						this.email = ''
						this.password = ''
						this.passwordConfirmation = ''
						this.success = 'Success!'
						this.error = ''
					})
				} else {
					this.success = ''
					this.error = errorMessage
				}
			},

			validate() {
				if (this.password != this.passwordConfirmation) {
					return [false, 'Passwords must match.']
				} 
				else if (this.email.length === 0) {
					return [false, 'Email address required.']
				}
				// Invalid email format
				else if (!/(?:[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-zA-Z0-9-]*[a-zA-Z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/.test(this.email)) {
					return [false, 'Email address must be valid.']
				}
				else if (this.password.length === 0) {
					return [false, 'Password required.']
				}
				else if (this.password.length < 8) {
					return [false, 'Password must be at least eight characters long.']
				}
				else {
					return [true, '']
				}
			},
			validateEmail() {
				if (this.email.length === 0) {
					return [false, 'Email address required.']
				}
				// Invalid email format
				else if (!/(?:[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-zA-Z0-9-]*[a-zA-Z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/.test(this.email)) {
					return [false, 'Email address must be valid.']
				}
				else if (this.fullName.length === 0) {
					return [false, "Name required."]
				}
				else if (!this.fullName.includes(" ")) {
					return [false, "First and last name required."]
				}
				else {
					return [true, '']
				}
			}
		}
	};
</script>

<style lang="scss" scope>
	.error-message {
		color: red;
		padding-top: 20px
	}

	.success-message {
		color: green;
		padding-top: 20px
	}

	.signup-form {
		max-width: 300px;
	}

	.fb-custom-signup {
		margin-top: 12px;
		margin-bottom: 12px;
	}

</style>