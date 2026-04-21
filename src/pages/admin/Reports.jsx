import { useState } from 'react';
import { useReport } from '@hooks/useReports';
import LoadingSpinner from '@components/common/LoadingSpinner';
import {
  DocumentArrowDownIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  FilmIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

const REPORT_TYPES = [
  { key: 'bookings', label: 'Bookings', icon: CalendarIcon, description: 'Daily booking counts and revenue' },
  { key: 'revenue', label: 'Revenue by Movie', icon: CurrencyDollarIcon, description: 'Revenue breakdown per movie' },
  { key: 'movies', label: 'Movie Performance', icon: FilmIcon, description: 'Screenings, bookings and revenue per film' }
];

const COLUMNS = {
  bookings: [
    { key: 'date', label: 'Date' },
    { key: 'bookingCount', label: 'Bookings' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
    { key: 'seatsSold', label: 'Seats Sold' },
    { key: 'revenue', label: 'Revenue ($)' }
  ],
  revenue: [
    { key: 'movieTitle', label: 'Movie' },
    { key: 'bookingCount', label: 'Bookings' },
    { key: 'seatsSold', label: 'Seats Sold' },
    { key: 'avgBookingValue', label: 'Avg. Value ($)' },
    { key: 'revenue', label: 'Total Revenue ($)' }
  ],
  movies: [
    { key: 'movieTitle', label: 'Movie' },
    { key: 'genre', label: 'Genre' },
    { key: 'rating', label: 'Rating' },
    { key: 'screeningCount', label: 'Screenings' },
    { key: 'bookingCount', label: 'Bookings' },
    { key: 'seatsSold', label: 'Seats Sold' },
    { key: 'revenue', label: 'Revenue ($)' }
  ]
};

const formatDateForInput = (date) => date.toISOString().split('T')[0];

const downloadCSV = (rows, columns, filename) => {
  const header = columns.map(c => c.label).join(',');
  const lines = rows.map(row =>
    columns.map(c => {
      const val = row[c.key] ?? '';
      return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
    }).join(',')
  );
  const csv = [header, ...lines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const SummaryCard = ({ label, value }) => (
  <div className="bg-white rounded-lg shadow p-4 text-center">
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-sm text-gray-500 mt-1">{label}</p>
  </div>
);

const AdminReportsPage = () => {
  const [reportType, setReportType] = useState('bookings');
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return formatDateForInput(d);
  });
  const [toDate, setToDate] = useState(() => formatDateForInput(new Date()));

  const { data, isLoading, error } = useReport(reportType, fromDate, toDate);

  const rows = data?.rows ?? [];
  const summary = data?.summary ?? {};
  const columns = COLUMNS[reportType];

  const currentType = REPORT_TYPES.find(t => t.key === reportType);

  const handleDownload = () => {
    if (!rows.length) return;
    downloadCSV(rows, columns, `${reportType}-report-${fromDate}-to-${toDate}.csv`);
  };

  const renderSummary = () => {
    if (!data?.summary) return null;
    const cards = [];
    if (reportType === 'bookings') {
      cards.push(
        { label: 'Total Bookings', value: summary.totalBookings ?? 0 },
        { label: 'Completed', value: summary.completedCount ?? 0 },
        { label: 'Cancelled', value: summary.cancelledCount ?? 0 },
        { label: 'Seats Sold', value: summary.totalSeatsSold ?? 0 },
        { label: 'Total Revenue', value: `$${(summary.totalRevenue ?? 0).toLocaleString()}` }
      );
    } else if (reportType === 'revenue') {
      cards.push(
        { label: 'Total Revenue', value: `$${(summary.totalRevenue ?? 0).toLocaleString()}` },
        { label: 'Total Bookings', value: summary.totalBookings ?? 0 },
        { label: 'Seats Sold', value: summary.totalSeatsSold ?? 0 },
        { label: 'Unique Movies', value: summary.uniqueMovies ?? 0 }
      );
    } else {
      cards.push(
        { label: 'Movies', value: summary.totalMovies ?? 0 },
        { label: 'Screenings', value: summary.totalScreenings ?? 0 },
        { label: 'Bookings', value: summary.totalBookings ?? 0 },
        { label: 'Total Revenue', value: `$${(summary.totalRevenue ?? 0).toLocaleString()}` }
      );
    }
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {cards.map(c => <SummaryCard key={c.label} {...c} />)}
      </div>
    );
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Generate and download operational reports</p>
        </div>
        <button
          onClick={handleDownload}
          disabled={!rows.length || isLoading}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
          Download CSV
        </button>
      </div>

      {/* Report Type Tabs */}
      <div className="flex space-x-2 mb-6 flex-wrap gap-y-2">
        {REPORT_TYPES.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setReportType(t.key)}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                reportType === t.key
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
          <input
            type="date"
            value={fromDate}
            max={toDate}
            onChange={e => setFromDate(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
          <input
            type="date"
            value={toDate}
            min={fromDate}
            max={formatDateForInput(new Date())}
            onChange={e => setToDate(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="text-sm text-gray-500 self-center">
          <span className="font-medium">{currentType?.label}</span> — {currentType?.description}
        </div>
      </div>

      {/* Summary Cards */}
      {!isLoading && !error && renderSummary()}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">
            <ChartBarIcon className="w-10 h-10 mx-auto mb-2 text-red-400" />
            <p>Failed to load report. Please try again.</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <ChartBarIcon className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p>No data found for the selected period.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map(col => (
                    <th key={col.key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rows.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    {columns.map(col => (
                      <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {col.key === 'revenue' || col.key === 'avgBookingValue'
                          ? `$${Number(row[col.key] ?? 0).toLocaleString()}`
                          : row[col.key] ?? '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReportsPage;
