import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "./User";

export enum SubscriptionStatus {
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
}

@Entity("subscriptions")
export class Subscription {
  @PrimaryColumn({ type: "uuid" })
  id!: string;

  @Column({ type: "uuid" })
  @Index()
  userId!: string;

  @Column({ type: "timestamp" })
  startDate!: Date;

  @Column({ type: "timestamp" })
  endDate!: Date;

  @Column({
    type: "enum",
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  @Index()
  status!: SubscriptionStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.subscriptions, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: User;
}
