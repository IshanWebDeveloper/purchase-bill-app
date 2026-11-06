export interface LoginRequest {
  email: string;
  password: string;
}

export interface Location {
  locationCode: string;
  locationName: string;
}

export interface LoginResponse {
  token: string;
  expiresAtUtc: string;
  displayName: string;
  locations: Location[];
}

/** What we keep in sessionStorage for the signed-in user. */
export interface Session {
  token: string;
  expiresAtUtc: string;
  displayName: string;
}
