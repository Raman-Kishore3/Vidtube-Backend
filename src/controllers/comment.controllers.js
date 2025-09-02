import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  if (!videoId) {
    throw new ApiError(400, "Video Id is required");
  }
  const limitNum = parseInt(limit);
  const pageNum = parseInt(page);
  const skip = (pageNum - 1) * limitNum;
  const comments = await Comment.find({ video: videoId })
    .skip(skip)
    .limit(limitNum);
  return res
    .status(200)
    .json(new ApiResponse(200, comments, "successfully retrieved comments"));
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const owner = req.user._id;
  const { content } = req.body;
  const { videoId } = req.params;

  if (!videoId || !content || !owner) {
    throw new ApiError(400, "All fields required");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "Video not found");
  }
  const newComment = new Comment({ content, video: videoId, owner });
  await newComment.save();
  return res
    .status(200)
    .json(new ApiResponse(200, newComment, "new comment added"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { content } = req.body;
  const owner = req.user._id;
  const { commentId } = req.params.commentId;
  if (!commentId) {
    throw new ApiError(400, "Comment ID not found");
  }
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(400, "Comment not found");
  }
  if (!comment.owner.equals(owner)) {
    throw new ApiError(400, "Not authorised to change comment");
  }
  if (!content) {
    throw new ApiError(400, "No content found");
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    { $set: { content } },
    { $new: true }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "Successfully updated comment"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { commentId } = req.params.commentId;
  const owner = req.user._id;
  if (!commentId) {
    throw new ApiError(400, "Comment Id not provided");
  }
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(400, "Comment not found");
  }
  if (!comment.owner.equals(owner)) {
    throw new ApiError(400, "Not authorised to change comment");
  }
  await Comment.findByIdAndDelete(commentId);
  return res
    .status(200)
    .json(new ApiResponse(200, commentId, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
