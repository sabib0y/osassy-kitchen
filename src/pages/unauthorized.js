import Link from 'next/link';

const UnauthorizedPage = () => {
  return (
    <div>
      <h1>Unauthorized</h1>
      <p>You do not have permission to view this page.</p>
      <Link href="/">
        <a>Go back to the homepage</a>
      </Link>
    </div>
  );
};

export default UnauthorizedPage;
