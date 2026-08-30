import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  FaArrowLeft,
  FaBell,
  FaCheck,
  FaCommentDots,
  FaFileAlt,
  FaSearch,
  FaShieldAlt,
  FaUserFriends,
  FaUserMinus,
  FaUserPlus,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import FriendChatBox from "../../components/friends/FriendChatBox";
import ConversationInfo from "../../components/friends/ConversationInfo";
import { getAvatarUrl, getInitialAvatarUrl } from "../../utils/imageUrl";
import { useNotifications } from "../../contexts/NotificationContext";
import "./FriendsPage.css";
import "./FriendActions.css";
import "./FriendsChatViewport.css";

const auth = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const FriendsPage = ({ socket }) => {
  const { toast, confirm } = useNotifications();
  const [activeTab, setActiveTab] = useState("friends");
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const navigate = useNavigate();

  const fetchFriendsData = async () => {
    try {
      const response = await axios.get("/api/friends/list", auth());
      const nextFriends = response.data.friends || [];
      setFriends(nextFriends);
      setPendingRequests(response.data.pendingRequests || []);
      setSelectedFriend((current) =>
        current
          ? nextFriends.find(
              (friend) =>
                String(friend.id || friend._id) ===
                String(current.id || current._id),
            ) || null
          : null,
      );
    } catch (error) {
      console.error("Không thể tải danh sách bạn bè:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      setCurrentUser(JSON.parse(localStorage.getItem("user")));
    } catch {
      setCurrentUser(null);
    }
    fetchFriendsData();
  }, []);

  useEffect(() => {
    if (!socket) return undefined;
    const updatePresence = ({ userId, status }) => {
      setFriends((previous) =>
        previous.map((friend) =>
          String(friend.id || friend._id) === String(userId)
            ? { ...friend, status }
            : friend,
        ),
      );
      setSelectedFriend((previous) =>
        previous && String(previous.id || previous._id) === String(userId)
          ? { ...previous, status }
          : previous,
      );
    };
    const removeRemoteFriend = ({ userId }) => {
      setFriends((previous) =>
        previous.filter(
          (friend) => String(friend.id || friend._id) !== String(userId),
        ),
      );
      setSelectedFriend((previous) =>
        previous && String(previous.id || previous._id) === String(userId)
          ? null
          : previous,
      );
    };
    socket.on("friendPresence", updatePresence);
    socket.on("friendRemoved", removeRemoteFriend);
    return () => {
      socket.off("friendPresence", updatePresence);
      socket.off("friendRemoved", removeRemoteFriend);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return undefined;
    const receiveCall = (call) => {
      const caller = friends.find(
        (friend) => String(friend.id || friend._id) === String(call.from),
      );
      if (caller) {
        setSelectedFriend(caller);
        setIncomingCall({ ...call, receivedAt: Date.now() });
      }
    };
    socket.on("incomingCall", receiveCall);
    return () => socket.off("incomingCall", receiveCall);
  }, [socket, friends]);

  const visibleFriends = useMemo(
    () =>
      friends.filter((friend) =>
        `${friend.fullName || ""} ${friend.username || ""}`
          .toLowerCase()
          .includes(searchTerm.trim().toLowerCase()),
      ),
    [friends, searchTerm],
  );
  const selectFriend = (friend) => {
    setIncomingCall(null);
    setSelectedFriend(friend);
  };
  const viewProfile = (friend) =>
    navigate(`/profile/${friend.id || friend._id}`);

  const respondToRequest = async (requestId, status) => {
    try {
      await axios.post("/api/friends/respond", { requestId, status }, auth());
      await fetchFriendsData();
    } catch (error) {
      toast(error.response?.data?.message || "Không thể xử lý lời mời.", "error");
    }
  };

  const removeFriend = async (friend) => {
    if (!await confirm({ title: 'Xóa bạn bè?', message: `Xóa ${friend.fullName || friend.username} khỏi danh sách bạn bè?`, confirmLabel: 'Xóa bạn', danger: true })) return;
    try {
      await axios.delete(`/api/friends/${friend.id || friend._id}`, auth());
      setFriends((previous) =>
        previous.filter(
          (item) =>
            String(item.id || item._id) !== String(friend.id || friend._id),
        ),
      );
      setSelectedFriend(null);
    } catch (error) {
      toast(error.response?.data?.message || "Không thể xóa bạn bè.", "error");
    }
  };

  if (loading)
    return (
      <main className="friends-page friends-loading">Đang tải bạn bè…</main>
    );

  return (
    <main className="friends-page">
      <aside className="friends-sidebar" aria-label="Danh sách trò chuyện">
        <div className="friends-sidebar-header">
          <div>
            <p className="friends-eyebrow">CHATWAVE</p>
            <h1>Đoạn chat</h1>
          </div>
          <button
            className="friends-icon-button"
            type="button"
            onClick={() => navigate("/")}
            aria-label="Về trang chủ"
            title="Về trang chủ"
          >
            <FaArrowLeft />
          </button>
        </div>
        <div className="friends-tabs" role="tablist" aria-label="Bạn bè">
          <button
            type="button"
            className={activeTab === "friends" ? "active" : ""}
            onClick={() => setActiveTab("friends")}
          >
            <FaUserFriends /> Bạn bè <span>{friends.length}</span>
          </button>
          <button
            type="button"
            className={activeTab === "requests" ? "active" : ""}
            onClick={() => setActiveTab("requests")}
          >
            <FaUserPlus /> Lời mời{" "}
            {pendingRequests.length > 0 && (
              <span>{pendingRequests.length}</span>
            )}
          </button>
        </div>
        {activeTab === "friends" && (
          <label className="friends-search">
            <FaSearch />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Tìm kiếm bạn bè"
              aria-label="Tìm kiếm bạn bè"
            />
          </label>
        )}
        <div className="friends-list">
          {activeTab === "friends"
            ? visibleFriends.map((friend) => {
                const friendId = friend.id || friend._id;
                const selected =
                  String(selectedFriend?.id || selectedFriend?._id) ===
                  String(friendId);
                const online = friend.status === "online";
                return (
                  <button
                    type="button"
                    className={`friend-list-item ${selected ? "selected" : ""}`}
                    key={friendId}
                    onClick={(event) =>
                      event.target.closest(".friend-avatar-wrap")
                        ? viewProfile(friend)
                        : selectFriend(friend)
                    }
                  >
                    <span className="friend-avatar-wrap" title="Xem hồ sơ">
                      <img
                        src={getAvatarUrl(friend.avatar, friend.username)}
                        alt={`Avatar ${friend.fullName || friend.username}`}
                        onError={(event) => {
                          event.currentTarget.src = getInitialAvatarUrl(
                            friend.username,
                          );
                        }}
                      />
                      <i className={online ? "online" : ""} />
                    </span>
                    <span className="friend-list-copy">
                      <strong>{friend.fullName || friend.username}</strong>
                      <small>{online ? "Đang hoạt động" : "Ngoại tuyến"}</small>
                    </span>
                    {online && (
                      <span
                        className="friend-list-live"
                        aria-label="Đang online"
                      />
                    )}
                  </button>
                );
              })
            : pendingRequests.map((request) => (
                <article className="friend-request" key={request.requestId}>
                  <img
                    src={getAvatarUrl(request.avatar, request.username)}
                    alt=""
                    onError={(event) => {
                      event.currentTarget.src = getInitialAvatarUrl(
                        request.username,
                      );
                    }}
                  />
                  <div>
                    <strong>{request.fullName || request.username}</strong>
                    <small>Đã gửi lời mời kết bạn</small>
                    <div className="friend-request-actions">
                      <button
                        type="button"
                        onClick={() =>
                          respondToRequest(request.requestId, "accepted")
                        }
                      >
                        <FaCheck /> Xác nhận
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          respondToRequest(request.requestId, "rejected")
                        }
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </article>
              ))}
          {activeTab === "friends" && !visibleFriends.length && (
            <p className="friends-empty">Không tìm thấy bạn bè phù hợp.</p>
          )}
          {activeTab === "requests" && !pendingRequests.length && (
            <p className="friends-empty">Bạn không có lời mời mới.</p>
          )}
        </div>
      </aside>
      <section className="friends-conversation">
        {selectedFriend && currentUser ? (
          <FriendChatBox
            currentUser={currentUser}
            friend={selectedFriend}
            socket={socket}
            incomingCall={incomingCall}
            onClose={() => { setSelectedFriend(null); setIncomingCall(null); }}
            variant="inline"
          />
        ) : (
          <div className="friends-chat-empty">
            <FaCommentDots />
            <h2>Chọn một cuộc trò chuyện</h2>
            <p>Nhắn tin, gửi ảnh và gọi video với bạn bè của bạn.</p>
          </div>
        )}
      </section>
      <aside className="friends-details" aria-label="Thông tin bạn bè">
        {selectedFriend ? (
          <>
            <button
              type="button"
              className="friends-detail-profile"
              onClick={() => viewProfile(selectedFriend)}
            >
              <span className="friends-detail-avatar">
                <img
                  src={getAvatarUrl(
                    selectedFriend.avatar,
                    selectedFriend.username,
                  )}
                  alt={`Avatar ${selectedFriend.fullName || selectedFriend.username}`}
                  onError={(event) => {
                    event.currentTarget.src = getInitialAvatarUrl(
                      selectedFriend.username,
                    );
                  }}
                />
                <i
                  className={selectedFriend.status === "online" ? "online" : ""}
                />
              </span>
              <h2>{selectedFriend.fullName || selectedFriend.username}</h2>
              <p
                className={
                  selectedFriend.status === "online" ? "online-text" : ""
                }
              >
                {selectedFriend.status === "online"
                  ? "Đang hoạt động"
                  : "Ngoại tuyến"}
              </p>
            </button>
            <div className="friends-detail-actions">
              <button
                type="button"
                onClick={() => selectFriend(selectedFriend)}
              >
                <FaCommentDots />
                <span>Nhắn tin</span>
              </button>
              <button type="button" onClick={() => viewProfile(selectedFriend)}>
                <FaUserFriends />
                <span>Hồ sơ</span>
              </button>
              <button
                type="button"
                className="friends-remove-button"
                onClick={() => removeFriend(selectedFriend)}
              >
                <FaUserMinus />
                <span>Xóa bạn</span>
              </button>
            </div>
            <ConversationInfo currentUser={currentUser} friend={selectedFriend} onRemoveFriend={removeFriend} />
          </>
        ) : (
          <div className="friends-detail-empty">
            <FaUserFriends />
            <p>Chọn một người bạn để xem thông tin.</p>
          </div>
        )}
      </aside>
    </main>
  );
};

export default FriendsPage;
