import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.models.js";
import { Tweet } from "../models/tweet.models.js";
import { Comment } from "../models/comment.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { _id: userId } = req.user;

  if (!videoId) {
    throw new ApiError(400, "VideoID is required");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "Video not found");
  }

  const existingLike = await Like.findOne({ video: videoId, likedBy: userId });
  if (existingLike) {
    await Like.deleteOne({ _id: existingLike._id });
    return res
      .status(200)
      .json(new ApiResponse(200, null, "successfully unliked"));
  }
  const newLike = new Like({ video: videoId, likedBy: userId });
  await newLike.save();
  return res.status(200).json(new ApiResponse(200, null, "successfully liked"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { _id: userId } = req.user;
  if (!commentId) {
    throw new ApiError(400, "Comment ID is required");
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(400, "Comment not found");
  }

  const existingLike = await Like.findOne({
    comment: commentId,
    likedBy: userId,
  });
  if (existingLike) {
    await Like.deleteOne({ _id: existingLike._id });
    return res
      .status(200)
      .json(new ApiResponse(200, null, "successfully unliked"));
  }
  const newLike = new Like({ comment: commentId, likedBy: userId });
  await newLike.save();
  return res.status(200).json(new ApiResponse(200, null, "successfully liked"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { _id: userId } = req.user;

  if (!tweetId) {
    throw new ApiError(400, "Tweet ID is required");
  }

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(400, "Tweet not found");
  }

  const existingLike = await Like.findOne({
    tweet: tweetId,
    likedBy: userId,
  });
  if (existingLike) {
    await Like.deleteOne({ _id: existingLike._id });
    return res
      .status(200)
      .json(new ApiResponse(200, null, "successfully unliked"));
  }
  const newLike = new Like({ tweet: tweetId, likedBy: userId });
  await newLike.save();
  return res.status(200).json(new ApiResponse(200, null, "successfully liked"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  const { _id: userId } = req.user;

  try {
    const likedVideos = await Like.aggregate([
      { $match: { likedBy: userId, video: { $exists: true, $ne: null } } },
      {
        $project: {
          video: 1,
          _id: 0,
        },
      },
    ]);
    return res
      .status(200)
      .json(
        new ApiResponse(200, likedVideos, "successfully got all liked videos")
      );
  } catch (error) {
    throw new ApiError(400, "Error getting liked videos");
  }
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
