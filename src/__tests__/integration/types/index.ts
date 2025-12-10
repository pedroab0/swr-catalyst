export type Todo = {
  id: number;
  title: string;
  completed: boolean;
};

export type ValidationErrorResponse = {
  error: string;
  code: string;
  details?: Record<string, string>;
};
