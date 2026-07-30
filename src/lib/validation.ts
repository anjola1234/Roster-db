import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(200),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(200),
  password: z.string().min(1, "Password is required").max(200),
});

export const newsletterSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(200),
});

export const reviewSchema = z.object({
  companySlug: z.string().trim().min(1).max(200),
  authorName: z.string().trim().min(2, "Name is too short").max(100),
  authorRole: z.string().trim().min(2, "Role is too short").max(150),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().min(3, "Title is too short").max(150),
  body: z.string().trim().min(10, "Please write a little more").max(4000),
});

export const productSubmissionSchema = z.object({
  name: z.string().trim().min(2).max(150),
  industrySlug: z.string().trim().min(1).max(100),
  shortDescription: z.string().trim().min(10).max(300),
  longDescription: z.string().trim().min(20).max(4000),
  website: z.string().trim().url("Enter a full URL, e.g. https://example.com").max(300),
  submittedByEmail: z.string().trim().toLowerCase().email("Enter a valid email").max(200),
  regionSlug: z.string().trim().min(1).max(100),
  city: z.string().trim().max(150).optional().or(z.literal("")),
});
