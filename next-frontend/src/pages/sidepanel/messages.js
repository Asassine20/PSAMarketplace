import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import useAuth from '../../hooks/useAuth';
import styles from '../../styles/sidepanel/Messages.module.css';

const Messages = () => {
  const { userId } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [orderNumber, setOrderNumber] = useState('');

  useEffect(() => {
    if (userId) {
      fetch(`/api/sidepanel/conversations?userId=${userId}`)
        .then(response => response.json())
        .then(data => {
          if (Array.isArray(data)) {
            setConversations(data);
          } else {
            setConversations([]);
          }
        })
        .catch(error => console.error('Error fetching conversations:', error));
    }
  }, [userId]);

  const fetchMessages = (conversationId) => {
    fetch(`/api/sidepanel/getMessages?conversationId=${conversationId}&userId=${userId}`)
      .then(response => response.json())
      .then(data => {
        if (Array.isArray(data.messages)) {
          setMessages(data.messages);
          const selectedConv = conversations.find(conv => conv.ConversationID === conversationId);
          setOrderNumber(selectedConv.OrderNumber);
          setConversations(prevConversations =>
            prevConversations.map(conversation =>
              conversation.ConversationID === conversationId
                ? { ...conversation, HasUnreadMessages: false }
                : conversation
            )
          );
        } else {
          setMessages([]);
        }
        setSelectedConversation(conversationId);
        markAsReadByBuyer(conversationId);
      })
      .catch(error => console.error('Error fetching messages:', error));
  };

  const markAsReadByBuyer = (conversationId) => {
    fetch('/api/sidepanel/markAsReadByBuyer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ conversationId, userId }),
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          setConversations(prevConversations => prevConversations.map(conversation => {
            if (conversation.ConversationID === conversationId) {
              return { ...conversation, HasUnreadMessages: false };
            }
            return conversation;
          }));
        }
      })
      .catch(error => console.error('Error marking as read by buyer:', error));
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;

    const conversation = conversations.find(c => c.ConversationID === selectedConversation);
    const { OrderNumber, Subject, SellerID, BuyerID } = conversation;

    fetch('/api/sidepanel/sendMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        conversationId: selectedConversation,
        messageText,
        sellerId: SellerID,
        buyerId: BuyerID,
        orderNumber: OrderNumber,
        subject: Subject,
      }),
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          setMessages([...messages, {
            MessageID: Date.now(), // Temporary ID for immediate rendering
            ConversationID: selectedConversation,
            SenderID: userId,
            MessageText: messageText,
            Timestamp: new Date().toISOString(),
            IsReadByBuyer: 1,
          }]);
          setMessageText('');
        }
      })
      .catch(error => console.error('Error sending message:', error));
  };

  const getSellerName = (sellerId) => {
    const conversation = conversations.find(c => c.SellerID === sellerId);
    return conversation ? conversation.StoreName : 'Seller';
  };

  const handleOrderNumberClick = () => {
    router.push(`/sidepanel/order-history?orderNumber=${orderNumber}`);
  };

  return (
    <div className={styles.messagesPage}>
      <h1 className={styles.title}>Messages</h1>
      <div className={styles.conversationsWrapper}>
        <div className={styles.conversations}>
          {conversations.map(conversation => (
            <div
              key={conversation.ConversationID}
              className={`${styles.conversation} ${conversation.ConversationID === selectedConversation ? styles.activeConversation : ''}`}
              onClick={() => fetchMessages(conversation.ConversationID)}
              style={{ fontWeight: conversation.HasUnreadMessages ? 'bold' : 'normal' }}
            >
              <p>{`${getSellerName(conversation.SellerID)} - ${conversation.Subject} (Order: ${conversation.OrderNumber})`}</p>
            </div>
          ))}
        </div>
        <div className={styles.messages}>
          {selectedConversation ? (
            <>
              <div className={styles.orderNumber}>
                <p onClick={handleOrderNumberClick} className={styles.orderNumberLink}>{orderNumber}</p>
              </div>
              <div className={styles.messageList}>
                {messages.map(message => (
                  <div key={message.MessageID} className={styles.message}>
                    <div className={message.SenderID === userId ? styles.sentMessage : styles.receivedMessage}>
                      <p className={styles.messageText}>{message.MessageText}</p>
                      <p className={styles.timestamp}>{new Date(message.Timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.messageInput}>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message here"
                ></textarea>
                <button onClick={handleSendMessage}>Send</button>
              </div>
            </>
          ) : (
            <p>Select a conversation to view messages.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
