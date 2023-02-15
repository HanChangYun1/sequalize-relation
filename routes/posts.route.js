const express = require("express");
const { Posts } = require("../models");
const { Op } = require("sequelize");
const authMiddleware = require("../middlewares/auth-middleware");
const router = express.Router();

router.post("/posts", authMiddleware, async (req, res) => {
  const { userId } = res.locals.user;
  const { title, content } = req.body;
  try {
    if (!req.body) {
      return res
        .status(412)
        .json({ message: "데이터 형식이 올바르지 않습니다." });
    }
    if (!title) {
      return res
        .status(412)
        .json({ message: "게시글 제목의 형식이 일치하지 않습니다." });
    }
    if (!content) {
      return res
        .status(412)
        .json({ message: "게시글 내용의 형식이 일치하지 않습니다." });
    }
    const post = await Posts.create({
      UserId: userId,
      title,
      content,
    });

    return res.status(201).json({ data: post });
  } catch (error) {
    return res.status(400).json({ message: "게시글 작성에 실패하였습니다." });
  }
});

router.get("/posts", async (req, res) => {
  try {
    const posts = await Posts.findAll({
      attributes: ["postId", "title", "createdAt", "updatedAt"],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({ data: posts });
  } catch (error) {
    return res.status(400).json({ message: "게시글 조회에 실패했습니다." });
  }
});

router.get("/posts/:postId", async (req, res) => {
  const { postId } = req.params;
  try {
    const post = await Posts.findOne({
      attributes: ["postId", "title", "content", "createdAt", "updatedAt"],
      where: { postId },
    });

    if (!post) {
      return res.status(404).json({ message: "게시글이 존재하지 않습니다." });
    }

    return res.status(200).json({ data: post });
  } catch (error) {
    return res.status(400).json({ message: "게시글 조회에 실패했습니다." });
  }
});

router.put("/posts/:postId", authMiddleware, async (req, res) => {
  const { postId } = req.params;
  const { userId } = res.locals.user;
  const { title, content } = req.body;
  try {
    if (!req.body) {
      return res
        .status(412)
        .json({ message: "데이터 형식이 올바르지 않습니다." });
    }
    if (!title) {
      return res
        .status(412)
        .json({ message: "게시글 제목의 형식이 일치하지 않습니다." });
    }
    if (!content) {
      return res
        .status(412)
        .json({ message: "게시글 내용의 형식이 일치하지 않습니다." });
    }

    const post = await Posts.findOne({ where: { postId } });

    if (!post) {
      return res.status(404).json({ message: "게시글이 존재하지 않습니다." });
    } else if (post.UserId !== userId) {
      return res.status(401).json({ message: "권한이 없습니다." });
    }

    await Posts.update(
      { title, content },
      {
        where: {
          [Op.and]: [{ postId }, { UserId: userId }],
        },
      }
    );

    return res.status(200).json({ data: "게시글이 수정되었습니다." });
  } catch (error) {
    return res.status(400).json({ message: "게시글 수정에 실패하였습니다." });
  }
});

router.delete("/posts/:postId", authMiddleware, async (req, res) => {
  const { postId } = req.params;
  const { userId } = res.locals.user;

  try {
    const post = await Posts.findOne({ where: { postId } });

    if (!post) {
      return res.status(404).json({ message: "게시글이 존재하지 않습니다." });
    } else if (post.UserId !== userId) {
      return res.status(401).json({ message: "권한이 없습니다." });
    }

    await Posts.destroy({
      where: {
        [Op.and]: [{ postId }, { UserId: userId }],
      },
    });

    return res.status(200).json({ data: "게시글이 삭제되었습니다." });
  } catch (error) {
    return res.status(401).json({ message: "게시글 삭제에 실패하였습니다." });
  }
});

module.exports = router;
