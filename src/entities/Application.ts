import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from "typeorm";
// import { InterviewCard } from "./InterviewCard";
import { User } from "./User";
import { Feedback } from "./Feedback";

export enum ApplicationStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

@Entity("applications")
export class Application {
  @PrimaryColumn({ type: "uuid" })
  id!: string;

  @Column({ type: "uuid" })
  @Index()
  cardId!: string;

  @Column({ type: "uuid" })
  @Index()
  applicantId!: string;

  @Column({ type: "timestamp", nullable: true })
  scheduledAt!: Date | null;

  @Column({
    type: "enum",
    enum: ApplicationStatus,
    default: ApplicationStatus.PENDING,
  })
  @Index()
  status!: ApplicationStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => require("./InterviewCard").InterviewCard, (card: import("./InterviewCard").InterviewCard) => card.applications, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "cardId" })
  card!: any; // Using any to avoid circular dependency metadata error

  @ManyToOne(() => User, (user) => user.applications, { onDelete: "CASCADE" })
  @JoinColumn({ name: "applicantId" })
  applicant!: User;

  @OneToMany(() => Feedback, (feedback) => feedback.application, {
    cascade: true,
  })
  feedbacks!: Feedback[];
}
