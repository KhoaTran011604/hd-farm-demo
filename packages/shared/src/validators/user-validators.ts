import * as Yup from 'yup';
import { USER_ROLES } from '../constants/roles.js';

export const loginSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
});

export const createUserSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
  name: Yup.string().required('Name is required').min(2).max(100),
  role: Yup.string().oneOf(USER_ROLES as unknown as string[]).optional(),
});

export const updateUserSchema = Yup.object().shape({
  name: Yup.string().min(2).max(100).optional(),
  role: Yup.string().oneOf(USER_ROLES as unknown as string[]).optional(),
});
