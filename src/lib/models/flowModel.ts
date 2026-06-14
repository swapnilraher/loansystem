export type ResponseType = "text" | "number" | "dropdown";

export interface FlowStep {
  id: string; // uuid
  question: string;
  responseType: ResponseType;
  options?: string[]; // for dropdown
  delaySeconds?: number;
}

export interface Flow {
  id: string;
  name: string; // e.g., "Home Loan"
  category: string; // loan category
  steps: FlowStep[];
}
