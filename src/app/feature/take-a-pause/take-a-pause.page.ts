import { Component, OnInit } from '@angular/core';
import { AudioService } from 'src/app/shared/services/audio/audio.service';
import { AudioPlayer } from 'src/app/shared/services/audio/audio.player';

@Component({
  selector: 'plh-take-a-pause',
  templateUrl: './take-a-pause.page.html',
  styleUrls: ['./take-a-pause.page.scss'],
})
export class TakeAPausePage implements OnInit {

  currentStep = 0;

  isPlaying = false;

  audioPlayer: AudioPlayer;
  audioTime: number = 0;

  stepTimings = [
    0, // Step 0
    7, // Step 1
    30, // Step 2
    75, // 1:15, Step 3
    109, // 1:49, Step 4
    120, // 2:00, Step 5
  ];
  audioLength = 133; // 2:13

  stepTitles = [
    "Let's take a minute to take a pause",
    "Step 1: Set up",
    "Step 2: Think, feel, body",
    "Step 3: Focus on your breath",
    "Step 4: Coming Back",
    "Step 5: Reflecting"
  ];

  constructor(private audioService: AudioService) { }

  ngOnInit() {
    this.audioPlayer = this.audioService.createPlayer("assets/audio/take-a-pause/take_a_pause_anna2.mp3");
    this.audioPlayer.setPlaybackRate(1);
    this.audioPlayer.pause();
    this.isPlaying = false;
    setInterval(() => {
      this.audioPlayer.getCurrentPosition().then((currentPos) => {
        this.audioTime = currentPos;
        for (var i = this.stepTimings.length; i > 0; i--) {
          if (currentPos > this.stepTimings[i]) {
            this.currentStep = i;
            break;
          }
        }
      });
    }, 300);
  }

  toggleAudio() {
    if (this.isPlaying) {
      this.isPlaying = false;
      this.audioPlayer.pause();
    } else {
      this.isPlaying = true;
      this.audioPlayer.play();
    }
  }

}