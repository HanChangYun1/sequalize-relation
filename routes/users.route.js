const express = require("express");
const jwt = require("jsonwebtoken");
const { Users, UserInfos } = require("../models");
const router = express.Router();

// 회원가입
router.post("/signup", async (req, res) => {
  const { nickname, password, confirm, name, age, gender, profileImage } =
    req.body;
  //조건식
  try {
    const rex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    const nicknameCheck = rex.test(nickname);
    const isExistUser = await Users.findOne({ where: { nickname } });
    if (!nicknameCheck || nickname.length < 3) {
      return res
        .status(412)
        .json({ errorMessage: "닉네임의 형식이 일치하지 않습니다." });
    }
    if (isExistUser) {
      return res.status(412).json({ errorMessage: "중복된 닉네임입니다." });
    }
    if (password !== confirm) {
      return res
        .status(412)
        .json({ errorMessage: "패스워드가 일치하지 않습니다." });
    }
    if (password.length < 4) {
      return res
        .status(412)
        .json({ errorMessage: "패스워드의 형식이 일치하지 않습니다." });
    }
    if (password.search(nickname) > -1) {
      return res
        .status(412)
        .json({ errorMessage: "패스워드에 닉네임이 포함되어 있습니다." });
    }

    // Users 테이블에 사용자를 추가합니다.
    const user = await Users.create({ nickname, password });
    // UserInfos 테이블에 사용자 정보를 추가합니다.
    const userInfo = await UserInfos.create({
      UserId: user.userId, // 생성한 유저의 userId를 바탕으로 사용자 정보를 생성합니다.
      name,
      age,
      gender: gender.toUpperCase(), // 성별을 대문자로 변환합니다.
      profileImage,
    });

    return res.status(201).json({ message: "회원가입이 완료되었습니다." });
  } catch (error) {
    res
      .status(400)
      .json({ message: "요청한 데이터 형식이 올바르지 않습니다." });
  }
});

// 로그인
router.post("/login", async (req, res) => {
  const { nickname, password } = req.body;
  const user = await Users.findOne({ where: { nickname } });
  try {
    if (!user) {
      return res
        .status(412)
        .json({ message: "닉네임 또는 패스워드를 확인해주세요." });
    } else if (user.password !== password) {
      return res
        .status(412)
        .json({ message: "닉네임 또는 패스워드를 확인해주세요." });
    }

    const token = jwt.sign(
      {
        userId: user.userId,
      },
      "customized_secret_key"
    );
    res.cookie("authorization", `Bearer ${token}`);
    return res.status(200).json({ message: "로그인 성공" });
  } catch (error) {
    res
      .status(400)
      .json({ message: "요청한 데이터 형식이 올바르지 않습니다." });
  }
});

// 사용자 조회
router.get("/users/:userId", async (req, res) => {
  const { userId } = req.params;

  const user = await Users.findOne({
    attributes: ["userId", "nickname", "createdAt", "updatedAt"],
    include: [
      {
        model: UserInfos, // 1:1 관계를 맺고있는 UserInfos 테이블을 조회합니다.
        attributes: ["name", "age", "gender", "profileImage"],
      },
    ],
    where: { userId },
  });

  return res.status(200).json({ data: user });
});

module.exports = router;
