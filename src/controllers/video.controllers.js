import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const filter = {};

  //this gets the video by title or description or both
  //options: "i" is insensitive case comaparison
  if (query) {
    filter.$or = [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ];
  }

  if (userId) {
    filter.owner = userId;
  }

  const sortObj = {};
  if (sortBy) {
    sortObj[sortBy] = sortType === "asc" ? 1 : -1;
  } else {
    sortObj.createdAt = -1;
  }
  try {
    const skip = (pageNum - 1) * limitNum;
    const videos = await Video.find(queryObj)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .select("-__v")
      .lean();

    const totalVideos = await Video.countDocuments(filter);

    //pagination is an object which gives the client the metadata
    const responseData = {
      videos,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalVideos / limitNum),
        totalItems: totalVideos,
        limit: limitNum,
        results: videos,
      },
    };
    return res
      .status(200)
      .json(new ApiResponse(200, responseData, "Videos fetched successfully"));
  } catch (error) {
    throw new ApiError(500, error.message, "Error fetching videos");
  }
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description, isPublished } = req.body;
  console.log(req.files);
  console.log(title, description, isPublished);

  const VideoCloud = await uploadOnCloudinary(
    req.files?.videoFile?.[0].path,
    "videos"
  );
  const thumbnailCloud = await uploadOnCloudinary(
    req.files?.thumbnail?.[0]?.path,
    "thumbnails"
  );

  const videoUrl = VideoCloud.secure_url; //secure_url is for cloudinary https link to the media
  const thumbnailUrl = thumbnailCloud.secure_url;
  const duration = VideoCloud.duration || 0; //VideoCloud has duration field in it

  console.log(videoUrl, thumbnailUrl, duration);

  //ApiError is for giving an exception which will not be caught by catch block
  //ApiResponse is for giving a response to the client directly as to make the user try again
  if (!videoUrl) {
    res.status(400).json(new ApiResponse(400, null, "Video file is required"));
  }
  if (!thumbnailUrl) {
    res
      .status(400)
      .json(new ApiResponse(400, null, "Thubnail file is required"));
  }

  const video = await Video.create({
    videoFile: videoUrl,
    thumbnail: thumbnailUrl,
    title,
    description,
    duration,
    isPublished,
    owner: req.user._id,
  });

  await video.save();
  res
    .status(200)
    .json(new ApiResponse(200, video, "Video published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //have to check whether videoId is valid object
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoID");
  }
  //if videoID not present
  if (!videoId) {
    throw new ApiError(400, "video is required");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "Video not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video found successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "VideoId is invalid");
  }
  const { title, description } = req.body;
  const thumbnail = req.file;

  console.log(req.body, req.file);

  if (thumbnail) {
    const thumbnailUrl = await uploadOnCloudinary(thumbnail.path);
    req.body.thumbnailUrl = thumbnailUrl.url; //updation of thumbnail
  }

  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      title,
      description,
      thumbnail: req.body.thumbnailUrl,
    },
    { new: true }
  );

  await video.save();

  if (!video) {
    throw new ApiError(400, "Video not found");
  }

  return res.status(200).json(200, video, "Video updated successfully");
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Video Id is invalid");
  }
  const video = await Video.findByIdAndDelete(videoId);

  if (!video) {
    throw new ApiError(400, "Video not found");
  }

  res.status(200).json(new ApiResponse(200, "Video successfully deleted"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Video ID is invalid");
  }
  if (!videoId) {
    throw new ApiError(400, "VideoId is required");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "Video not found");
  }
  video.isPublished = !video.isPublished;
  await video.save();
  res
    .status(200)
    .json(new ApiResponse(200, video, "Video status updated successfully"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
