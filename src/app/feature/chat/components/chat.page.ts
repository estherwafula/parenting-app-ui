import { Component, ChangeDetectorRef, Input, ViewChild, ElementRef } from "@angular/core";
import { AnimationOptions } from "ngx-lottie";
import { ActivatedRoute, Router } from "@angular/router";
import { ChatMessage, ChatResponseOption, ResponseCustomAction, IChatService } from "../models";
import { Subscription } from "rxjs";
import { LocalStorageService } from "src/app/shared/services/local-storage/local-storage.service";
import { ModalController } from "@ionic/angular";
import { Capacitor } from "@capacitor/core";
import { ChatActionService } from "../services/common/chat-action.service";
import { OfflineChatService } from "../services/offline/offline-chat.service";
import { OnlineChatService } from "../services/online/online-chat.service";

@Component({
  selector: "app-chat",
  templateUrl: "./chat.page.html",
  styleUrls: ["./chat.page.scss"],
})
export class ChatPage {
  messages: ChatMessage[] = [];
  allMessages: ChatMessage[] = [];
  showFlowSkip = true;
  responseOptions: ChatResponseOption[] = [];
  lastReceivedMsg: ChatMessage;
  botBlobState: "walking-in" | "walking-out" | "talking" | "run-in" | "still" | "absent" =
    "walking-in";
  backgroundBlobVisible: boolean = false;
  botAnimOptions: AnimationOptions = {
    loop: false,
    path: "/assets/lottie-animations/Walk_In_Entrance_Pass_v2.json",
  };
  // Used for getting estimates of number of messages sent automatically
  autoReplyEnabled: boolean = false;
  autoReplyDelay = 500;
  autoReplyWord = "N";
  autoRepeatPhrase = "Repeat simulation";
  autoEndPhrase = "THE END";
  messagesSent: number = 0;
  messagesReceived: number = 0;
  debugMsg: string = "testing???";
  sentResponsesByMessage: { [messageText: string]: string[] } = {};
  scrollingInterval: any;
  inputValue: string = "";
  showingAllMessages = true;
  character: "guide" | "egg" = "guide";
  messageSubscription: Subscription;
  chatViewType: "normal" | "story" = "normal";
  chatService: IChatService;
  isModal: boolean;
  // when using a modal flowName can be passed by component props
  @Input() flowName: string;
  @ViewChild("normalChatEnd") chatEndDiv: ElementRef;
  constructor(
    private cd: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router,
    private chatActionService: ChatActionService,
    private localStorageService: LocalStorageService,
    private offlineChatService: OfflineChatService,
    private onlineChatService: OnlineChatService,
    public modalCtrl: ModalController
  ) {}

  /** Initialise chat configuration on page enter */
  ionViewDidEnter() {
    this.checkIsModal();
    this.processRouteParams();
    this.processRouteQueryParams();
    this.initChatService();
    this.startFlow(this.flowName);
  }

  /** Load the online or offline chat service dependent on user preferences
   *  (online chat can only be used when running on native)
   */
  private initChatService() {
    if (!Capacitor.isNative) {
      this.chatService = this.offlineChatService;
    } else {
      const useOfflineChat = this.localStorageService.getBoolean("use_offline_chat");
      this.chatService = useOfflineChat ? this.offlineChatService : this.onlineChatService;
    }
    console.log(`%cUsing ${this.chatService.type} chat `, "color: #9c9c9c");
  }

  /** The chat page can sometimes be displayed in a modal. Check if it is, and assign variable to handle close button display */
  private checkIsModal() {
    this.modalCtrl.getTop().then((isModal) => (this.isModal = isModal ? true : false));
  }

  /** Route params can be used to specify a flow id in route navigation, e.g. /chat/welcome_flow. Set if specified */
  private processRouteParams() {
    const { params } = this.route.snapshot;
    if (params.flowName) {
      this.flowName = params.flowName;
    }
  }

  /** Query params are used to pass character information */
  private processRouteQueryParams() {
    const { queryParams } = this.route.snapshot;
    this.character = queryParams["character"] || "guide";
  }

  private async startFlow(flowName: string) {
    await this.chatService.ready();
    if (flowName) {
      this.chatService.startFlowByName(flowName);
      this.messageSubscription = this.chatService.messages$.subscribe((messages) => {
        if (messages.length > 0) {
          const latestMessage = messages[messages.length - 1];
          console.log("message received", latestMessage);
          if (latestMessage.actions && latestMessage.actions.length > 0) {
            for (let action of latestMessage.actions) {
              this.chatActionService.executeChatAction(action);
            }
          }
          this.onNewMessage(latestMessage);
        }
      });
    } else {
      console.error("no flow name specified");
    }
  }

  ionViewDidLeave() {
    this.messageSubscription.unsubscribe();
  }

  private onNewMessage(message: ChatMessage) {
    console.log("Got to the bit where I do something with the messages!", message);
    message.dateReceived = new Date();
    this.lastReceivedMsg = message;
    if (message.isStory) {
      this.chatViewType = "story";
    } else {
      this.chatViewType = "normal";
      this.allMessages.push(message);

      if (this.showingAllMessages) {
        this.messages = this.allMessages;
      } else {
        this.messages = this.allMessages.slice(this.allMessages.length - 2);
      }
    }
    if (message.sender === "bot") {
      this.responseOptions = message.responseOptions ? message.responseOptions : [];
    } else {
      this.responseOptions = [];
    }
    setTimeout(() => {
      this.chatEndDiv.nativeElement.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 50);
    this.cd.detectChanges();
  }

  private doCustomResponseAction(action: ResponseCustomAction) {
    if (action === "bot-leave") {
      this.botAnimOptions = {
        loop: false,
        path: "/assets/lottie-animations/Walk_Out_Exit_Pass_v2.json",
      };
      this.botBlobState = "walking-out";
      setTimeout(() => (this.botBlobState = "absent"), 4200);
    } else if (action === "bot-run-back") {
      this.botBlobState = "run-in";
      this.botAnimOptions = {
        loop: false,
        path: "/assets/lottie-animations/Run_In_Entrance_Pass_v2.json",
      };
      setTimeout(() => (this.botBlobState = "still"), 3200);
    } else if (action === "bot-walk-back") {
      this.botBlobState = "walking-in";
      this.botAnimOptions = {
        loop: false,
        path: "/assets/lottie-animations/Walk_In_Entrance_Pass_v2.json",
      };
      setTimeout(() => (this.botBlobState = "still"), 3200);
    }
  }

  onInputSubmit(event: any) {
    this.sendCustomOption(this.inputValue);
    this.inputValue = "";
  }

  sendCustomOption(text: string) {
    this.onNewMessage({ text, sender: "user" });
    this.chatService.sendMessage({ text, sender: "user" });
    this.messagesSent += 1;
  }

  selectResponseOption(option: ChatResponseOption) {
    const { text, customAction, imageUrl } = option;
    if (customAction) {
      this.doCustomResponseAction(option.customAction);
    }
    this.onNewMessage({ text, sender: "user" });
    this.chatService.sendMessage({ text, sender: "user" });
    this.messagesSent += 1;
  }

  toggleShowAllMessages() {
    if (this.showingAllMessages) {
      this.messages = this.allMessages.slice(this.allMessages.length - 2);
      this.showingAllMessages = false;
    } else {
      this.messages = this.allMessages;
      this.showingAllMessages = true;
    }
  }

  stringify(obj: any) {
    return JSON.stringify(obj);
  }

  skipFlow() {
    // this.localStorageService.setBoolean("welcome_skipped", true);
    this.router.navigateByUrl("/home");
  }

  sameAsLastCharacter(currentMsg: ChatMessage, prevMsg: ChatMessage) {
    if (prevMsg) {
      return currentMsg.character === prevMsg.character;
    }
    return false;
  }

  onStoryNextClicked() {
    this.chatService.sendMessage({
      sender: "user",
      text: "Next",
    });
  }

  onStoryPreviousClicked() {
    this.chatService.sendMessage({
      sender: "user",
      text: "Previous",
    });
  }
}