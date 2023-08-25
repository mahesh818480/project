import { inject, Injectable } from '@angular/core';
import { Models, RealtimeResponseEvent } from 'appwrite';

import { BehaviorSubject, take, concatMap, filter } from 'rxjs';

import { AppwriteApi, AppwriteEnvironment } from '../appwrite';
import { AuthService } from './auth.service';

export type Message = Models.Document & {
  user: string;
  message: string;
};

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private appwriteAPI = inject(AppwriteApi);
  private appwriteEnvironment = inject(AppwriteEnvironment);

  private _messages$ = new BehaviorSubject<Message[]>([]);
  readonly messages$ = this._messages$.asObservable();

  constructor(private authService: AuthService) {}

  loadMessages() {
    this.appwriteAPI.database
      .listDocuments<Message>(
        this.appwriteEnvironment.chatCollectionId,
        '',
      )
      .then((response) => {
        this._messages$.next(response.documents);
      });
  }

  sendMessage(message: string) {
    return this.authService.user$.pipe(
      filter((user) => !!user),
      take(1),
      concatMap((user) => {
        const data = {
          user: user!.name,
          message,
        };

        return this.appwriteAPI.database.createDocument(this.appwriteEnvironment.chatCollectionId,
          'data',
          'unique()',
          ['role:all'],
          [`user:${user!.$id}`]
        );
      })
    );
  }
}