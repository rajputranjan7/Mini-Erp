import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/prisma";
import { env } from "../../config/env";
import { ApiError } from "../../utils/ApiError";
import { LoginInput } from "./auth.schema";

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  // Deliberately vague message: don't reveal whether the email exists.
  if (!user || !user.isActive) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const passwordOk = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordOk) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn } as jwt.SignOptions
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}
