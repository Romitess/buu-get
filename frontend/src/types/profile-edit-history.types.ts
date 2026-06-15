export interface ProfileEditHistory {
  profileEditHistoryId: number;
  userProfileId: number;
  modifierId: number;
  modifierName: string;
  modifierRole: string;
  modifiedFields: string;
  oldValues: string | null;
  newValues: string | null;
  createdAt: string;
}
