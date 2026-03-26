import { useState } from 'react';
import { NextPage, GetServerSidePropsContext } from 'next';
import { useSession, getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  FileText,
  Settings,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Calendar,
  PoundSterling,
  BarChart3,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useReports, ReportType, ReportPeriod } from '@/hooks/admin/useReports';
import styles from '@/styles/pages/admin/reports.module.scss';

const COLOURS = ['#C52D2F', '#F1C40F', '#FF6F3C', '#3498db', '#2ecc71', '#9b59b6'];

const Sidebar = () => {
  const router = useRouter();
  const currentPath = router.pathname;

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
    { icon: ShoppingCart, label: 'Orders', href: '/admin/orders' },
    { icon: CreditCard, label: 'Subscriptions', href: '/admin/subscriptions' },
    { icon: Package, label: 'Menu Items', href: '/admin/menu' },
    { icon: Users, label: 'Users', href: '/admin/users' },
    { icon: FileText, label: 'Reports', href: '/admin/reports' },
    { icon: Settings, label: 'Settings', href: '/admin/settings' },
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <div className={styles.logoContent}>
          <div className={styles.logoIcon}>OA</div>
          <span className={styles.logoText}>Osassy Admin</span>
        </div>
      </div>

      <nav className={styles.nav}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <Icon />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-GB').format(Math.round(value));
};

const AdminReports: NextPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reportType, setReportType] = useState<ReportType>('revenue');
  const [period, setPeriod] = useState<ReportPeriod>('month');

  const { data: reportData, isLoading, error } = useReports(reportType, period);

  if (status === 'loading') {
    return (
      <div className={styles.loadingContainer}>
        <Sidebar />
        <div className={styles.loadingContent}>
          <div className={styles.loadingGrid}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={styles.loadingCard}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== 'ADMIN') {
    router.push('/login');
    return null;
  }

  const periodLabels: Record<ReportPeriod, string> = {
    week: 'This Week',
    month: 'This Month',
    year: 'This Year',
  };

  const reportTypeLabels: Record<ReportType, string> = {
    revenue: 'Revenue',
    orders: 'Orders',
    subscriptions: 'Subscriptions',
  };

  const getValueLabel = (type: ReportType, value: number): string => {
    return type === 'revenue' ? formatCurrency(value) : formatNumber(value);
  };

  const getSummaryIcon = (type: ReportType) => {
    switch (type) {
      case 'revenue':
        return PoundSterling;
      case 'orders':
        return ShoppingCart;
      case 'subscriptions':
        return CreditCard;
    }
  };

  const SummaryIcon = getSummaryIcon(reportType);

  return (
    <div className={styles.reportsContainer}>
      <Sidebar />

      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          {/* Header */}
          <div className={styles.pageHeader}>
            <div className={styles.headerLeft}>
              <h1 className={styles.pageTitle}>Reports</h1>
              <p className={styles.pageSubtitle}>
                Analyse your business performance
              </p>
            </div>
            <div className={styles.headerRight}>
              <div className={styles.periodSelector}>
                <Calendar size={16} />
                {(['week', 'month', 'year'] as ReportPeriod[]).map((p) => (
                  <button
                    key={p}
                    className={`${styles.periodBtn} ${period === p ? styles.active : ''}`}
                    onClick={() => setPeriod(p)}
                  >
                    {periodLabels[p]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Report Type Tabs */}
          <div className={styles.reportTabs}>
            {(['revenue', 'orders', 'subscriptions'] as ReportType[]).map((type) => (
              <button
                key={type}
                className={`${styles.reportTab} ${reportType === type ? styles.active : ''}`}
                onClick={() => setReportType(type)}
              >
                <BarChart3 size={18} />
                {reportTypeLabels[type]}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Loading report data...</p>
            </div>
          ) : error ? (
            <div className={styles.errorState}>
              <p>Failed to load report data. Please try again.</p>
            </div>
          ) : reportData ? (
            <>
              {/* Summary Cards */}
              <div className={styles.summaryGrid}>
                <div className={styles.summaryCard}>
                  <div className={styles.summaryIcon}>
                    <SummaryIcon size={24} />
                  </div>
                  <div className={styles.summaryContent}>
                    <span className={styles.summaryLabel}>
                      Total {reportTypeLabels[reportType]}
                    </span>
                    <span className={styles.summaryValue}>
                      {getValueLabel(reportType, reportData.summary.total)}
                    </span>
                  </div>
                </div>

                <div className={styles.summaryCard}>
                  <div className={styles.summaryIcon}>
                    <BarChart3 size={24} />
                  </div>
                  <div className={styles.summaryContent}>
                    <span className={styles.summaryLabel}>Average</span>
                    <span className={styles.summaryValue}>
                      {getValueLabel(reportType, reportData.summary.average)}
                    </span>
                  </div>
                </div>

                <div className={styles.summaryCard}>
                  <div
                    className={`${styles.summaryIcon} ${
                      reportData.summary.change >= 0 ? styles.positive : styles.negative
                    }`}
                  >
                    {reportData.summary.change >= 0 ? (
                      <TrendingUp size={24} />
                    ) : (
                      <TrendingDown size={24} />
                    )}
                  </div>
                  <div className={styles.summaryContent}>
                    <span className={styles.summaryLabel}>Change</span>
                    <span
                      className={`${styles.summaryValue} ${
                        reportData.summary.change >= 0 ? styles.positive : styles.negative
                      }`}
                    >
                      {reportData.summary.change >= 0 ? '+' : ''}
                      {getValueLabel(reportType, reportData.summary.change)}
                    </span>
                  </div>
                </div>

                <div className={styles.summaryCard}>
                  <div
                    className={`${styles.summaryIcon} ${
                      reportData.summary.changePercent >= 0 ? styles.positive : styles.negative
                    }`}
                  >
                    {reportData.summary.changePercent >= 0 ? (
                      <TrendingUp size={24} />
                    ) : (
                      <TrendingDown size={24} />
                    )}
                  </div>
                  <div className={styles.summaryContent}>
                    <span className={styles.summaryLabel}>Growth Rate</span>
                    <span
                      className={`${styles.summaryValue} ${
                        reportData.summary.changePercent >= 0 ? styles.positive : styles.negative
                      }`}
                    >
                      {reportData.summary.changePercent >= 0 ? '+' : ''}
                      {reportData.summary.changePercent.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className={styles.chartsGrid}>
                <div className={styles.chartCard}>
                  <h3 className={styles.chartTitle}>
                    {reportTypeLabels[reportType]} Trend
                  </h3>
                  <div className={styles.chartContainer}>
                    {reportData.trend.length > 0 ? (
                      <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={reportData.trend}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                          <YAxis
                            tickFormatter={(value) =>
                              reportType === 'revenue'
                                ? `${(value / 1000).toFixed(0)}k`
                                : value.toString()
                            }
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip
                            formatter={(value: number) => [
                              getValueLabel(reportType, value),
                              reportTypeLabels[reportType],
                            ]}
                            labelStyle={{ fontWeight: 'bold' }}
                          />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#C52D2F"
                            strokeWidth={2}
                            dot={{ fill: '#C52D2F', strokeWidth: 2 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className={styles.chartPlaceholder}>
                        No trend data available
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.chartCard}>
                  <h3 className={styles.chartTitle}>Breakdown by Status</h3>
                  <div className={styles.chartContainer}>
                    {reportData.breakdown.length > 0 ? (
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie
                            data={reportData.breakdown}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={90}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="label"
                            label={({ label, percentage }) =>
                              `${label}: ${percentage.toFixed(0)}%`
                            }
                          >
                            {reportData.breakdown.map((_, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLOURS[index % COLOURS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) => [
                              getValueLabel(reportType, value),
                              'Value',
                            ]}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className={styles.chartPlaceholder}>
                        No breakdown data available
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Breakdown Table */}
              <div className={styles.breakdownSection}>
                <h3 className={styles.sectionTitle}>Detailed Breakdown</h3>
                <div className={styles.breakdownTable}>
                  <table>
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Value</th>
                        <th>Percentage</th>
                        <th>Distribution</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.breakdown.map((item, index) => (
                        <tr key={item.label}>
                          <td className={styles.statusCell}>
                            <span
                              className={styles.statusDot}
                              style={{ background: COLOURS[index % COLOURS.length] }}
                            ></span>
                            {item.label}
                          </td>
                          <td className={styles.valueCell}>
                            {getValueLabel(reportType, item.value)}
                          </td>
                          <td>{item.percentage.toFixed(1)}%</td>
                          <td>
                            <div className={styles.progressBar}>
                              <div
                                className={styles.progressFill}
                                style={{
                                  width: `${item.percentage}%`,
                                  background: COLOURS[index % COLOURS.length],
                                }}
                              ></div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
};

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  if (session.user.role !== 'ADMIN') {
    return {
      redirect: {
        destination: '/unauthorised',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};

export default AdminReports;
