<template>
	<div @click="joinRoom">
		<md-list-item :class="['room-nav-slide', selected, intro, alert]">
		  <avatar :name="room.topic" />

		  <div :class="['md-list-text-container', notification]">
		    <span>{{room.topic}}</span>
		    <p :class="['subtitle-text', alert_subtitle]">{{subtitle}}</p>
		  </div>

		  <!--
		  <div v-if="room.type === 3" class="time-remaining">expires in {{timeRemaining}} hours</div>
		  <div v-else :class="'formatted-time ' + notification">{{formattedTime}}</div>
		 
		  <md-divider class="md-inset"></md-divider> 
		   -->
		</md-list-item>
	</div>
</template>

<script>
	import Cookies from 'js-cookie'
	import moment from 'moment'
	import Avatar from '@/components/Avatar'

	export default {
		props: ['room'],
		components: {
			Avatar
		},
		computed: {
			formattedTime() {
				if (!this.room.last_slide) {
					return ''
				} else {
					return moment(this.room.last_slide.updated_at).calendar(null, {
					  sameDay: '[Today at] h:mm a',
					  lastDay: '[Yesterday at] h:mm a',
					  nextDay: '[Tomorrow at] h:mm a',
					  nextWeek: "[Next] dddd [at] h:mm a",
					  lastWeek: '[Last] dddd [at] h:mm a',
					  sameElse: 'h:mm a [on] MMMM Do[,] YYYY'
					});
				}
			},
			timeRemaining() {
				return 48
			},
			subtitle() {
				let slide = this.room.last_slide
				if (!slide) {
					return ''
				} else if (slide.text && slide.author_name) {
					return slide.author_name + ": " + slide.text
				} else if (slide.text) {
					return slide.text
				} else {
					return "Say hello to someone new :)"
				}
				
			},
			// Styling
			selected() {
				if ("rooms:" + this.room.id == this.$store.state.currentRoomChannel.topic) {
					return 'selected'
				} else {
					return null
				}
			},
			notification() {
				let notifications = this.room.user_active_notifications ? this.room.user_active_notifications : []
				return notifications.length > 0 ? 'notification' : null
			},
			intro() {
				return this.room.type === 3 ? 'intro' : null
			},
			alert() {
				return this.room.alert ? 'alert' : null
			},
			alert_subtitle() {
				return this.room.alert ? 'alert_subtitle' : null
			}
		},
		methods: {
			joinRoom() {
				this.$router.push({
					name: 'topic', 
					params: {topic_id: this.room.id}
				})
				this.$store.dispatch('updateCurrentRoomChannel', {
					room: this.room
				}),
				this.$store.dispatch('denotify', {
					room: this.room,
					userChannel: this.$store.state.userChannel,
				})
			}
		}
	}
</script>

<style lang="scss" scoped>
	$border-color: rgb(225, 225, 225);
	$border-color-darker: rgb(215, 215, 215);

	$primary-darker-color: rgb(217, 98, 12);
  	$primary-color: rgb(244, 128, 45);
 	$primary-color-l1: rgb(250, 192, 150);
  	$primary-color-l2: rgb(252, 224, 203);
  	$primary-color-l3: rgb(254, 243, 234);
  	//$primary-color-l4: rgb(254, 247, 242); 
	//$primary-color-l4: rgb(254, 250, 245);
	$secondary-d2: rgb(68, 57, 48);
	$secondary-l2: rgb(88, 77, 68);
	$secondary-text: rgba(170, 152, 146, 1);
	$secondary-text-l1: rgba(170, 152, 146, 0.8);

	.room-nav-slide {
		cursor: pointer;
		font-size: 14px;
		font-weight: bold;
		// color: white;
		color: $secondary-text;
		//background-color: rgb(232, 230, 225);
		//background-color: rgb(144, 168, 142);
	}

	.room-nav-slide:hover {
		// background-color: $border-color;
		background-color: $secondary-d2;
	}

	.room-nav-slide:active {
		// background-color: rgb(215, 215, 215);
		background-color: $secondary-l2;
	}

	.subtitle-text {
		color: $secondary-text-l1 !important;
	}

	.selected {
		// background-color: $border-color-darker;
		background-color: $primary-darker-color;
		color: white;
	}

	.selected:hover {
		background-color: $primary-darker-color;
	}

	.selected .subtitle-text {
		color: rgba(220, 220, 220, 1) !important;
	}

	.formatted-time {
		font-size: 12px;
		min-width: 56px;
		padding-left: 12px;
		color: rgb(151, 151, 151);
	}

	.notification {
		font-weight: bold;
		//color: white;
	}

	@keyframes alert {
	    0%   {background-color: inherit;}
	    50%  {background-color: $primary-darker-color; color: white; }
	    100% {background-color: inherit;}
	}
	@keyframes alert_subtitle {
	    0%   {color: inherit;}
	    50%  {color: rgba(220, 220, 220, 1) !important; }
	    100% {color: inherit;}
	}
	.alert {
		animation: alert 3s infinite;
	}
	.alert_subtitle {
		animation: alert_subtitle 3s infinite;
	}

	.intro {
		background-color: $primary-color-l2;
	}
	.intro:hover {
		background-color: $primary-color-l1;
	}
	.time-remaining {
		font-size: 12px;
	}

</style>