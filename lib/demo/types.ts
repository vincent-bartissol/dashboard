export type DemoRole = "user" | "admin";

export type DemoUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role: DemoRole;
  banned: boolean;
  banReason: string | null;
  createdAt: string;
  arrondissement: string | null;
  firstName: string;
  lastName: string;
};

export type DemoFavorite = {
  id: string;
  datasetId: string;
  recordId: string;
  label: string;
  geo: string | null;
};

export type DemoSession = {
  userId: string;
  email: string;
  name: string;
  role: DemoRole;
  emailVerified: boolean;
};

export type DemoActivity = {
  id: string;
  userId: string;
  action: string;
  createdAt: string;
  metadata: string | null;
};

export type DemoStoreState = {
  session: DemoSession | null;
  users: DemoUser[];
  favorites: DemoFavorite[];
  activity: DemoActivity[];
  pendingEmail?: {
    kind: "verification" | "otp" | "reset" | "change-email";
    email: string;
    newEmail?: string;
  } | null;
};
