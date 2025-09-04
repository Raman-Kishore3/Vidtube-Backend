import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const { _id: userId } = req.user;
  // TODO: toggle subscription
  console.log(userId, channelId);
  if (!channelId || !isValidObjectId(channelId)) {
    throw new ApiError(400, "ChannelId is not valid");
  }
  //as userId is object and channelId is url parameters which is string
  if (channelId === userId.toString()) {
    throw new ApiError(400, "You cannot subscribe to your own channel");
  }
  try {
    const channelExist = await User.findById(channelId).select(
      "-password -refreshToken"
    );
    if (!channelExist) {
      throw new ApiError(400, "Channel does not exist");
    }
    const existing = await Subscription.findOne({
      subscriber: userId,
      channel: channelId,
    });
    if (!existing) {
      //delete the subscription
      await Subscription.deleteOne({ _id: existing._id });
      return res
        .status(200)
        .json(new ApiResponse(200, null, "Unsubscribed channel successfully"));
    } else {
      //add the subscription
      const newSubscriber = new Subscription({
        subscriber: userId,
        channel: channelId,
      });
      await newSubscriber.save();
      return res
        .status(200)
        .json(new ApiResponse(200, null, "Subscribed to channel successfully"));
    }
  } catch (error) {
    throw new ApiError(400, error.message || "Something went wrong");
  }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!channelId || isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channelId is required");
  }
  try {
    const channelExist = await User.findById(channelId);
    if (!channelExist) {
      throw new ApiError(400, "Channel does not exist");
    }
    const subscriberList = await Subscription.aggregate([
      { $match: { channel: channelId } },
      {
        $project: {
          _id: 0,
          subcriber: 1,
        },
      },
    ]);
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          subscriberList,
          "Successfully got list of subscribers"
        )
      );
  } catch (error) {
    throw new ApiError(400, error.message || "Something went wrong");
  }
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  if (!subscriberId || !isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Valid subscriberId is required");
  }
  try {
    const channelList = await Subscription.aggregate([
      { $match: { subscriber: subscriberId } },
      {
        $project: {
          _id: 0,
          channel: 1,
        },
      },
    ]);
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          channelList,
          "Successfully got Subcriber's channels"
        )
      );
  } catch (error) {
    throw new ApiError(400, error.message || "Something is wrong");
  }
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
