import { UploadApiResponse } from "cloudinary";
import { cloudinary } from "../../lib/cloudinary";
import { prisma } from "../../lib/prisma";
import type { IUpdateProfilePayload } from "./user.interface";

const updateProfile = async (
  userId: string,
  payload: IUpdateProfilePayload,
) => {
  const userData = {
    ...(payload.firstName !== undefined && {
      firstName: payload.firstName.trim(),
    }),
    ...(payload.middleName !== undefined && {
      middleName: payload.middleName?.trim() || null,
    }),
    ...(payload.lastName !== undefined && {
      lastName: payload.lastName.trim(),
    }),
    ...(payload.phone !== undefined && {
      phone: payload.phone?.trim() || null,
    }),
  };
  const updatedUser = await prisma.$transaction(async (transaction) => {
    await transaction.user.update({
      where: { id: userId },
      data: userData,
      omit: { password: true },
    });

    if (payload.address !== undefined || payload.emergencyPhone !== undefined) {
      const studentProfile = await transaction.studentProfile.findUnique({
        where: { userId },
      });

      if (studentProfile) {
        await transaction.studentProfile.update({
          where: { userId },
          data: {
            ...(payload.address !== undefined && {
              address: payload.address?.trim() || null,
            }),
            ...(payload.emergencyPhone !== undefined && {
              emergencyPhone: payload.emergencyPhone?.trim() || null,
            }),
          },
        });
      }
    }

    return transaction.user.findUnique({
      where: { id: userId },
      omit: { password: true },
      include: { studentProfile: true },
    });
  });

  return updatedUser;
};

const uploadProfileImage = async (buffer: Buffer, userId: string) => {
  const currentUser = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      imagePublicId: true,
      imageUrl: true,
    },
  });

  const cloudinaryResult = await new Promise<UploadApiResponse>(
    (resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "auto",
          },
          async (error, result) => {
            if (error) {
              return reject(error);
            }
            if (!result) {
              return reject(new Error("No result returned from Cloudinary"));
            }
            resolve(result);
          },
        )
        .end(buffer);
    },
  );

  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      imageUrl: cloudinaryResult.secure_url,
      imagePublicId: cloudinaryResult.public_id,
    },
    omit: {
      password: true,
    },
  });

  //privous image destory
  if (currentUser?.imagePublicId && currentUser.imageUrl) {
    await cloudinary.uploader.destroy(currentUser.imagePublicId);
  }
  return updatedUser;
};

export const UserServices = {
  uploadProfileImage,
  updateProfile,
};
