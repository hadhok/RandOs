import {
  pgTable,
  uuid,
  text,
  timestamp,
  real,
  pgEnum,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const hikeStatusEnum = pgEnum("hike_status", [
  "draft",
  "planned",
  "completed",
]);

export const waypointTypeEnum = pgEnum("waypoint_type", [
  "start",
  "end",
  "poi",
  "shelter",
  "water",
  "viewpoint",
  "generic",
]);

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const hikes = pgTable("hikes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  /** Total distance in meters */
  distance: real("distance"),
  /** Total elevation gain in meters */
  elevationGain: real("elevation_gain"),
  /** Estimated duration in seconds */
  durationSeconds: integer("duration_seconds"),
  status: hikeStatusEnum("status").notNull().default("draft"),
  /** Optional GPX file URL stored in Supabase Storage */
  gpxUrl: text("gpx_url"),
});

export const waypoints = pgTable("waypoints", {
  id: uuid("id").primaryKey().defaultRandom(),
  hikeId: uuid("hike_id")
    .notNull()
    .references(() => hikes.id, { onDelete: "cascade" }),
  /** Position in the hike's ordered list of waypoints */
  orderIndex: integer("order_index").notNull().default(0),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  /** Elevation in meters above sea level */
  elevation: real("elevation"),
  name: text("name"),
  type: waypointTypeEnum("type").notNull().default("generic"),
});

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const usersRelations = relations(users, ({ many }) => ({
  hikes: many(hikes),
}));

export const hikesRelations = relations(hikes, ({ one, many }) => ({
  user: one(users, { fields: [hikes.userId], references: [users.id] }),
  waypoints: many(waypoints),
}));

export const waypointsRelations = relations(waypoints, ({ one }) => ({
  hike: one(hikes, { fields: [waypoints.hikeId], references: [hikes.id] }),
}));

// ---------------------------------------------------------------------------
// Exported types
// ---------------------------------------------------------------------------

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Hike = typeof hikes.$inferSelect;
export type NewHike = typeof hikes.$inferInsert;

export type Waypoint = typeof waypoints.$inferSelect;
export type NewWaypoint = typeof waypoints.$inferInsert;
