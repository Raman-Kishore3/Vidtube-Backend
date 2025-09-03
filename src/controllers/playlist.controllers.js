import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const { _id: userId } = req.user;
  //TODO: create playlist
  if (!name || !description) {
    throw new ApiError(400, "All fields are required");
  }
  try {
  } catch (error) {
    console.log(error);
    throw new ApiError(400, "Server error");
  }
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists
  if (!userId || !isValidObjectId(userId)) {
    throw new ApiError(400, "Valid userId is required");
  }
  try {
    const playlists = await Playlist.find({ owner: userId });
    if (!playlists || playlists.length === 0) {
      throw new ApiError(400, "No playlist found");
    }
    return res
      .status(200)
      .json(
        new ApiResponse(200, playlists, "Successfully got user's playlists")
      );
  } catch (error) {
    throw new ApiError(400, error.message || "Error getting playlists");
  }
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: get playlist by id
  if (!playlistId || !isValidObjectId(playlistId)) {
    throw new ApiError(400, "Valid playlistId is required");
  }
  try {
    const playlist = await Playlist.findById(playlistId).populate("vidoes");
    if (!playlist) {
      throw new ApiError(400, "Playlist not found");
    }
    return res
      .status(200)
      .json(200, playlist, "Successfully retrieved playlist");
  } catch (error) {
    throw new ApiError(
      400,
      error.message || "Internal error occured. Try again"
    );
  }
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (
    !playlistId ||
    !videoId ||
    !isValidObjectId(playlistId) ||
    !isValidObjectId(videoId)
  ) {
    throw new ApiError(400, "Valid playlistId or videoId is required");
  }
  try {
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      throw new ApiError(400, "Playlist not found");
    }
    if (!playlist.owner.equals(req.user._id)) {
      throw new ApiError(400, "Unauthorized to change playlist");
    }
    const video = await Video.findById(videoId);
    if (!video) {
      throw new ApiError(400, "Video not found");
    }

    if (!playlist.videos.includes(video)) {
      playlist.videos.push(videoId);
      await playlist.save();
    }
    return res.status.json(
      new ApiResponse(200, playlist, "Successfully added video to playlist")
    );
  } catch (error) {
    throw new ApiError(400, error.message || "Something went wrong");
  }
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist
  if (
    !playlistId ||
    !videoId ||
    !isValidObjectId(playlistId) ||
    !isValidObjectId(videoId)
  ) {
    throw new ApiError(400, "Valid playlistId and videoId is required");
  }
  try {
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      throw new ApiError(400, "Playlist not found");
    }
    if (!playlist.owner.equals(req.user._id)) {
      throw new ApiError(400, "Unauthorized access to playlist");
    }
    if (!playlist.videos.includes(videoId)) {
      throw new ApiError(400, "Video not found in playlist");
    }
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
      playlistId,
      {
        $pull: { videos: videoId },
      },
      { $new: true }
    );
    await updatedPlaylist.save();
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updatePlaylist,
          "Video successfully removed from playlist"
        )
      );
  } catch (error) {
    throw new ApiError(400, error.message || "Something went wrong");
  }
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist
  if (!playlistId || !isValidObjectId(playlistId)) {
    throw new ApiError(400, "Valid playlistId is required");
  }
  try {
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      throw new ApiError(400, "Playlist is not found");
    }
    if (!playlist.owner.equals(req.user._id)) {
      throw new ApiError(400, "Unauthorized action");
    }
    await Playlist.findByIdAndDelete(playlistId);
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Successfully deleted playlist"));
  } catch (error) {
    throw new ApiError(400, error.message || "Something went wrong");
  }
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  //TODO: update playlist
  if (!playlistId || !isValidObjectId(playlistId)) {
    throw new ApiError(400, "Valid playlistID is required");
  }
  try {
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      throw new ApiError(400, "Playlist not found");
    }
    if (!playlist.owner.equals(req.user._id)) {
      throw new ApiError(400, "Unauthorized action");
    }
    if (title && title.trim() !== "") {
      playlist.title = title;
    }
    if (description && description.trim() !== "") {
      playlist.description = description;
    }
    await playlist.save();
    return res
      .status(200)
      .json(
        new ApiResponse(
          400,
          playlist,
          "Playlist title and description successfully updated"
        )
      );
  } catch (error) {
    throw new ApiError(400, error.message || "Something went wrong");
  }
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
