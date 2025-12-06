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
import { User } from "./User";
// import { Application } from "./Application";

export enum CardStatus {
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

@Entity("interview_cards")
export class InterviewCard {
  @PrimaryColumn({ type: "uuid" })
  id!: string;

  @Column({ type: "uuid" })
  @Index()
  userId!: string;

  @Column({ type: "varchar" })
  profession!: string;

  @Column("simple-array")
  techStack!: string[];

  @Column({ type: "timestamp" })
  @Index()
  scheduledAt!: Date;

  @Column({
    type: "enum",
    enum: CardStatus,
    default: CardStatus.OPEN,
  })
  @Index()
  status!: CardStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => User, (user) => user.interviewCards, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: User;

  @OneToMany(() => require("./Application").Application, (app: any) => app.card, {
    cascade: true,
  })
  applications!: any[];
}
