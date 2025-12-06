import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
// import { InterviewCard } from "./InterviewCard";
// import { Application } from "./Application";
// import { Feedback } from "./Feedback";
// import { Subscription } from "./Subscription";
// import { Payment } from "./Payment";

export enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
}

@Entity("users")
export class User {
  @PrimaryColumn({ type: "uuid" })
  id!: string;

  @Column({ type: "varchar", unique: true })
  email!: string;

  @Column({ type: "varchar", nullable: true })
  name!: string | null;

  @Column({ type: "varchar", nullable: true })
  telegram!: string | null;

  @Column({ type: "varchar", nullable: true })
  discord!: string | null;

  @Column({ type: "varchar", nullable: true })
  whatsapp!: string | null;

  @Column({ type: "varchar" })
  password!: string;

  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.USER,
  })
  role!: UserRole;

  @Column({ type: "int", default: 0 })
  points!: number;

  @Column({ type: "int", default: 0 })
  freeInterviewsUsed!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => require("./InterviewCard").InterviewCard, (card: any) => card.user, { cascade: true })
  interviewCards!: any[];

  @OneToMany(() => require("./Application").Application, (app: any) => app.applicant, {
    cascade: true,
  })
  applications!: any[];

  @OneToMany(() => require("./Feedback").Feedback, (feedback: any) => feedback.fromUser, { cascade: true })
  feedbacksGiven!: any[];

  @OneToMany(() => require("./Feedback").Feedback, (feedback: any) => feedback.toUser, { cascade: true })
  feedbacksReceived!: any[];

  @OneToMany(() => require("./Subscription").Subscription, (sub: any) => sub.user, {
    cascade: true,
  })
  subscriptions!: any[];

  @OneToMany(() => require("./Payment").Payment, (payment: any) => payment.user, { cascade: true })
  payments!: any[];
}
