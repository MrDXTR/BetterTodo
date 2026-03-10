import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
    "process due-date automation reminders",
    { minutes: 15 },
    internal.automations.processDueDateReminders,
    {},
);

export default crons;
