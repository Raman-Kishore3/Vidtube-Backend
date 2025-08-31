import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { _id: userId } = req.user;

  if (!content) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Content is required"));
  }
  const newTweet = await Tweet.create({
    content,
    owner: userId,
  });
  try {
    return res
      .status(200)
      .json(new ApiResponse(200, newTweet, "Tweet successfully created"));
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json(new ApiResponse(500, null, "Something went wrong"));
  }
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!tweetId) {
    throw new ApiError(400, "UserId is required");
  }
  try {
    const userExist = await User.findById(tweetId);
    if (!userExist) {
      throw new ApiError(400, "User not found");
    }
    const userTweets = await Tweet.find({ owner: tweetId });
    return res
      .status(200)
      .json(
        new ApiResponse(200, userTweets, "User's tweets found successfully")
      );
  } catch (error) {
    throw new ApiError(400, "Something went wrong", error);
  }
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;

  if (!tweetId) {
    throw new ApiError(400, "tweetId is required");
  }
  if (!content) {
    throw new ApiError(400, "content is required");
  }
  try {
    const tweetExist = await Tweet.findById(tweetId);
    if (!tweetExist) {
      throw new ApiError(400, "Tweet not found");
    }
    tweetExist.content = content;
    await tweetExist.save();
    return res
      .status(200)
      .json(new ApiResponse(200, tweetExist, "Tweet updated successfully"));
  } catch (error) {
    console.log(error);
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Something went wrong"));
  }
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!tweetId) {
    throw new ApiError(400, "tweet not found");
  }
  try {
    const tweetExist = await Tweet.findById(tweetId);
    if (!tweetExist) {
      throw new ApiError(400, "Tweet does not exist");
    }
    await Tweet.findByIdAndDelete(tweetId);
    return res
      .status(200)
      .json(new ApiResponse(200, "Tweet successfully deleted"));
  } catch (error) {
    console.log(error);
    throw new ApiError(400, "Something went wrong");
  }
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
