import { useEffect, useState } from 'react';
import { NextPage, GetServerSidePropsContext } from 'next';
import { useSession, getSession } from 'next-auth/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// --- Types ---
interface DashboardData {
  revenue: {
    monthly: number;
    monthlyGrowthRate: number;
  };
  overview: {
    totalActiveSubscriptions: number;
    subscriptionGrowthRate: number;
    totalUsers: number;
    userGrowthRate: number;
  };
  orders: {
    byStatus: Record<string, { count: number }>;
    recent: Array<{
      id: string;
      user: { name: string };
      totalPrice: number;
      status: string;
    }>;
  };
  menuItems: {
    topPerforming: Array<{
      menuItemId: string;
      menuItem: { name: string };
      _sum: { quantity: number };
    }>;
  };
}

// --- Components ---

const KpiCard = ({ title, value, change, changeType }: { title: string; value: string | number; change: number; changeType: string }) => (
  <div className="bg-white p-6 rounded-lg shadow">
    <h3 className="text-gray-500 text-sm font-medium uppercase">{title}</h3>
    <p className="text-3xl font-bold text-gray-800">{value}</p>
    <p className={`text-sm ${change > 0 ? 'text-green-500' : 'text-red-500'}`}>
      {change > 0 ? '+' : ''}{change} {changeType}
    </p>
  </div>
);

const AdminDashboard: NextPage = () => {
  const { data: session, status } = useSession();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch('/api/admin/dashboard');
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
      setLoading(false);
    };

    if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);

  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return <div>Loading...</div>;
  }

  if (!session || session.user.role !== 'ADMIN') {
    return <div>Access Denied</div>;
  }

  const orderStatusForChart = dashboardData?.orders?.byStatus ? Object.entries(dashboardData.orders.byStatus).map(([name, { count }]) => ({ name, value: count })) : [];
  const COLORS = ['#FFC107', '#C62828', '#4CAF50', '#757575']; // Yellow (Pending), Red (Cancelled), Green (Delivered), Grey

  return (
    <div className="bg-gray-100 min-h-screen">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <div>
            <span className="mr-4">Welcome, {session.user.name}</span>
            {/* Add logout button here */}
          </div>
        </div>
      </header>
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {dashboardData ? (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <KpiCard title="Total Revenue" value={`$${dashboardData.revenue.monthly.toFixed(2)}`} change={dashboardData.revenue.monthlyGrowthRate} changeType="this month" />
                <KpiCard title="Active Subscriptions" value={dashboardData.overview.totalActiveSubscriptions} change={dashboardData.overview.subscriptionGrowthRate} changeType="this month" />
                <KpiCard title="Total Users" value={dashboardData.overview.totalUsers} change={dashboardData.overview.userGrowthRate} changeType="this month" />
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
                  <h3 className="font-semibold text-lg mb-4">Revenue Trend</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[] /* Placeholder for revenue trend data */}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="revenue" fill="#C62828" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="font-semibold text-lg mb-4">Order Status</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={orderStatusForChart} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value">
                        {orderStatusForChart.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent Orders and Top Items */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="font-semibold text-lg mb-4">Recent Orders</h3>
                  <ul className="divide-y divide-gray-200">
                    {dashboardData.orders.recent.map(order => (
                      <li key={order.id} className="py-3 flex justify-between items-center">
                        <div>
                          <p className="font-medium">Order #{order.id.substring(0, 8)}</p>
                          <p className="text-sm text-gray-500">{order.user.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${order.totalPrice.toFixed(2)}</p>
                          <p className={`text-sm font-semibold ${order.status === 'PENDING' ? 'text-yellow-500' : 'text-green-500'}`}>{order.status}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="font-semibold text-lg mb-4">Top Performing Menu Items</h3>
                  <ul className="divide-y divide-gray-200">
                    {dashboardData.menuItems.topPerforming.map(item => (
                      <li key={item.menuItemId} className="py-3 flex justify-between items-center">
                        <p className="font-medium">{item.menuItem.name}</p>
                        <p className="text-gray-600">{item._sum.quantity} sold</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <p>Loading dashboard data...</p>
          )}
        </div>
      </main>
    </div>
  );
};

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getSession(context);

  if (!session || session.user.role !== 'ADMIN') {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  return {
    props: { session },
  };
}

export default AdminDashboard;
