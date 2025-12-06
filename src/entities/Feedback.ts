import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
// import { Application } from "./Application";
import { User } from "./User";

@Entity("feedbacks")
export class Feedback {
  @PrimaryColumn({ type: "uuid" })
  id!: string;

  @Column({ type: "uuid" })
  @Index()
  applicationId!: string;

  @Column({ type: "uuid" })
  @Index()
  fromUserId!: string;

  @Column({ type: "uuid" })
  @Index()
  toUserId!: string;

  @Column("text")
  message!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => require("./Application").Application, (app: import("./Application").Application) => app.feedbacks, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "applicationId" })
  application!: any; // Using any to avoid circular dependency metadata error

  @ManyToOne(() => User, (user) => user.feedbacksGiven, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "fromUserId" })
  fromUser!: User;

  @ManyToOne(() => User, (user) => user.feedbacksReceived, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "toUserId" })
  toUser!: User;
}
