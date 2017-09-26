import { Mongo } from 'meteor/mongo';

// offline races
export const Races = new Mongo.Collection('races');
export const ProductItems = new Mongo.Collection('productItems');
export const Orders = new Mongo.Collection('orders');

// order number for Orders
export const OrderNumber = new Mongo.Collection('orderNumber');

// user publicID, user number for Users
export const UserNumber = new Mongo.Collection('userNumber');

// virtual race collection for virtual race and challenges
export const VirtualRaces = new Mongo.Collection('virtualRaces');

// result for all races
export const AllResults = new Mongo.Collection('allResults');
export const Submissions = new Mongo.Collection('submissions');
export const Comments = new Mongo.Collection('comments');
export const Following = new Mongo.Collection('following');
export const Notifications = new Mongo.Collection('notifications');
export const Reviews = new Mongo.Collection('reviews');
export const HeroEvents = new Mongo.Collection('heroEvents');
export const HeroEventsApplications = new Mongo.Collection('heroEventsApplications');

export const Images = new Mongo.Collection('images');
export const Badges = new Mongo.Collection('badges');
export const UserMeta = new Mongo.Collection('userMeta');

export const Payments = new Mongo.Collection('payments');
export const Blogs = new Mongo.Collection('blogs');

export const Teams = new Mongo.Collection('teams');
export const Countries = new Mongo.Collection('countries');
