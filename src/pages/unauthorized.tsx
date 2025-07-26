import Link from 'next/link';
import { NextPage } from 'next';

const UnauthorizedPage: NextPage = () => {
  return (
    <div>
      <h1>Unauthorized</h1>
      <p>You do not have permission to view this page.</p>
      <Link href="/">
        Go back to the homepage
      </Link>
    </div>
  );
};

export default UnauthorizedPage;