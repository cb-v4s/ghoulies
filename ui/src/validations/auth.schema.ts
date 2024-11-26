import * as z from "zod";

export const registerSchema = z
  .object({
    email: z.string({
      required_error: "Email is required",
    }),
    username: z
      .string({
        required_error: "Username is required",
      })
      .min(1, "Username must be at least 1 character")
      .max(16, "Username must have at max 16 characters"),
    password: z
      .string({
        required_error: "Password is required",
      })
      .min(5, "Password must be at least 5 characters"),
    confirmPassword: z.string({
      required_error: "Confirm Password is required",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const loginSchema = z.object({
  email: z.string({
    required_error: "Email is required",
  }),
  password: z
    .string({
      required_error: "Password is required",
    })
    .min(5, "Password must be at least 5 characters"),
});
