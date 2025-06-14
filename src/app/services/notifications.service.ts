import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor, CapacitorHttp, HttpResponse } from '@capacitor/core';
import {PushNotifications} from '@capacitor/push-notifications'
import OneSignal from 'onesignal-cordova-plugin';
import { environment } from 'src/environments/environment.prod';
import { INotification } from '../interfaces/notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  router = inject(Router);
  constructor() { }

  init(){

    const isPushNotificationsAvailable = Capacitor.isPluginAvailable('PushNotifications');

    if(isPushNotificationsAvailable){
      PushNotifications.requestPermissions().then((result) => {
      if(result.receive){
        OneSignal.initialize(environment.oneSignalID)

        OneSignal.Notifications.addEventListener('click', (e)=>{
          const notification: any = e.notification;

          if(notification.additionalData['url']){
            const ruta = notification.additionalData['url'];
            this.router.navigateByUrl(ruta);
          }
        })
      }
    })
    }
  }

  enviarNotificacion(notification: INotification){
    
    return CapacitorHttp.post({
      url: 'https://onesignal.com/api/v1/notifications',
      params: {},
      data:{
        app_id: environment.oneSignalID,
        included_segments: ['Total Subscriptions'],
        headings: {"en": notification.title},
        contents: {"en": notification.body},
        data:{url: notification.url}
      },
      headers: {
        'Content-type': 'application/json',
        'Authorization': `Basic ${environment.oneSignalRestApi}`
      } 
    }).then( (response: HttpResponse) =>{
      console.log(response);
      return response.status === 200
      
    })
  }
}
