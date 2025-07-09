import React, { useEffect, useState } from 'react';
import { CometChat } from '@cometchat-pro/chat';
import { Avatar, Flex } from 'antd';

interface Props {
  onSelectUser: (user: CometChat.UserObj) => void;
}

const UserList: React.FC<Props> = ({ onSelectUser }) => {
  const [users, setUsers] = useState<CometChat.UserObj[]>([]);
  // get users in contact with this user
  useEffect(() => {
    const fetchUsers = async () => {
      const request = new CometChat.UsersRequestBuilder().setLimit(20).build();
      try {
        const userList = await request.fetchNext();
        setUsers(userList);
      } catch (err) {
        console.error('Error in get users', err);
      }
    };
    fetchUsers();
  }, []);

  return (
    <Flex vertical gap={40} style={{ width: '100%', padding: 10 }}>
      <h3>Users</h3>
      {users.map(user => (
        <Flex style={{ cursor: 'pointer' }} align="center" gap={5} key={user.uid} justify="space-between" onClick={() => onSelectUser(user)}>
          <div key={user.uid} >
            {user.name || user.uid}
          </div>
          <Avatar src={user.avatar} size={'large'} />
        </Flex>
      ))}
    </Flex>
  );
};

export default UserList;
