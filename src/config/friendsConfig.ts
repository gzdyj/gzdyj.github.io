import type { FriendLink, FriendsPageConfig } from "../types/friendsConfig";

export const friendsPageConfig: FriendsPageConfig = {
	title: "",
	description: "",
	showCustomContent: true,
	showComment: false,
	randomizeSort: false,
};

export const friendsConfig: FriendLink[] = [
	{
		title: "smallkun",
		imgurl: "https://www.gravatar.com/avatar/f0792b4f1eaa79e52dbb9766289724a6?d=identicon&s=128",
		desc: "C/C++、Java、前后端、服务器运维，一个热爱技术的年轻人。",
		siteurl: "https://smallkun.cn/",
		tags: ["技术", "C语言", "Linux"],
		weight: 1,
		enabled: true,
	},
	{
		title: "久雨",
		imgurl: "https://www.gravatar.com/avatar/?d=mp&s=128",
		desc: "久雨的 Halo 博客。",
		siteurl: "http://109.107.137.49:8090/",
		tags: ["博客"],
		weight: 1,
		enabled: true,
	},
];

export const getEnabledFriends = (): FriendLink[] => {
	const friends = friendsConfig.filter((friend) => friend.enabled);

	if (friendsPageConfig.randomizeSort) {
		return friends.sort(() => Math.random() - 0.5);
	}

	return friends.sort((a, b) => b.weight - a.weight);
};
