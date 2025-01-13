import React from 'react';

interface Props {
    children: React.ReactNode;
}

const Content: React.FC<Props> = ({ children }) => (
    <div style={{ padding: '20px', width: '100%' }}>{children}</div> // Usunięto flexGrow, dodano width: 100%
);

export default Content;