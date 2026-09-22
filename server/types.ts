export type User = {
  id: string;
  token: string;
  name: string;
  avatar: string;
  verified: boolean;
  phoneVerified: boolean;
  interests: string[];
  city: string;
  district: string;
  age: number;
  phone: string;
  rating: number;
  ratingsCount: number;
  looking: boolean;
  freeAfter: string;
  lat?: number;
  lng?: number;
};

export type Message = {
  id: string;
  userId: string;
  text: string;
  at: string;
};

export type Gathering = {
  id: string;
  hostId: string;
  mode: "now" | "plan";
  activity: string;
  title: string;
  note: string;
  lat: number;
  lng: number;
  placeLabel: string;
  when: string;
  expiresAt: string;
  spots: number;
  participantIds: string[];
  messages: Message[];
};

export type Invite = {
  id: string;
  fromId: string;
  toId: string;
  status: "pending" | "accepted" | "declined";
};

export type InterestMark = {
  fromId: string;
  toId: string;
};

export type Rating = {
  fromId: string;
  toId: string;
  gatheringId?: string;
  score: number;
  text?: string;
  at?: string;
};

export type Complaint = {
  id: string;
  fromId: string;
  toId: string;
  reason: string;
  at: string;
};

export type DirectMessage = {
  id: string;
  fromId: string;
  toId: string;
  text: string;
  at: string;
};

export type Database = {
  users: User[];
  gatherings: Gathering[];
  invites: Invite[];
  interests: InterestMark[];
  ratings: Rating[];
  complaints: Complaint[];
  dms: DirectMessage[];
  seeded?: boolean;
};
