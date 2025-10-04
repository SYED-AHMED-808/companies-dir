import React, { useEffect, useMemo, useState } from "react";
import { MOCK_COMPANIES } from "./assets/mock_data";
import { FaBackward, FaForward } from "react-icons/fa6";
import { FaStepBackward, FaStepForward } from "react-icons/fa";
export default function CompaniesDirectory() {
  // data states
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // filters & UI states
  const [query, setQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [selectedIndustry, setSelectedIndustry] = useState("All");
  const [sortBy, setSortBy] = useState("name_asc"); // name_asc | name_desc | employees_asc | employees_desc

  // pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const fetchCompanies = (opts = {}) => {
    const { delay = 600, fail = false } = opts;
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (fail) return reject(new Error("Failed to fetch companies"));

        resolve(JSON.parse(JSON.stringify(MOCK_COMPANIES)));
      }, delay);
    });
  };

  // initial fetch
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    fetchCompanies({ delay: 700 })
      .then((data) => {
        if (!mounted) return;
        setCompanies(data);
        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message || "Unknown error");
        setLoading(false);
      });
    return () => (mounted = false);
  }, []);

  // derived filter lists
  const locations = useMemo(
    () => ["All", ...Array.from(new Set(companies.map((c) => c.location)))],
    [companies]
  );
  const industries = useMemo(
    () => ["All", ...Array.from(new Set(companies.map((c) => c.industry)))],
    [companies]
  );

  // filtered + sorted data
  const filtered = useMemo(() => {
    let arr = [...companies];
    // search by name
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      arr = arr.filter((c) => c.name.toLowerCase().includes(q));
    }
    // location
    if (selectedLocation !== "All")
      arr = arr.filter((c) => c.location === selectedLocation);
    // industry
    if (selectedIndustry !== "All")
      arr = arr.filter((c) => c.industry === selectedIndustry);

    // sorting
    switch (sortBy) {
      case "name_asc":
        arr = arr.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name_desc":
        arr = arr.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "employees_asc":
        arr = arr.sort((a, b) => a.employees - b.employees);
        break;
      case "employees_desc":
        arr = arr.sort((a, b) => b.employees - a.employees);
        break;
      default:
        break;
    }
    return arr;
  }, [companies, query, selectedLocation, selectedIndustry, sortBy]);

  // pagination calculations
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  useEffect(() => {
    // ensure page is valid when filters change
    if (page > totalPages) setPage(1);
  }, [totalPages]);

  const pageData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  if (loading) return <CenteredLoading />;
  if (error)
    return (
      <CenteredError message={error} onRetry={() => window.location.reload()} />
    );

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-semibold">Companies Directory</h1>
          <div className="text-sm text-gray-600">
            Showing <span className="font-medium">{total}</span> companies
          </div>
        </header>

        {/* Controls */}
        <div className="bg-white p-4 rounded-2xl shadow-sm mb-6">
          <div className="flex flex-col md:grid md:grid-cols-2 gap-1 md:gap-3">
            <div className="col-span-2 ">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by company name..."
                className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="flex-1 text-xs md:text-sm border px-2 py-2 rounded-md"
              >
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>

              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="flex-1 text-xs md:text-sm border px-2 py-2 rounded-md"
              >
                {industries.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 justify-between md:justify-end">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className=" flex-1 border text-xs md:text-sm px-3 py-2 rounded-md"
              >
                <option value="name_asc">Name ↑</option>
                <option value="name_desc">Name ↓</option>
                <option value="employees_asc">Employees ↑</option>
                <option value="employees_desc">Employees ↓</option>
              </select>

              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className=" flex-1 border text-xs md:text-sm px-3 py-2 rounded-md"
              >
                <option value={5}>5 / page</option>
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results - responsive: table on large screens, cards on small */}
        {pageData.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl shadow-sm text-center">
            No companies match your filters.
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="hidden md:block bg-white rounded-2xl shadow-sm overflow-x-auto">
              <table className="min-w-full divide-y">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                      Industry
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                      Employees
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                      Founded
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y">
                  {pageData.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium">
                        {c.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {c.industry}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {c.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {c.employees}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {c.founded}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden grid gap-3">
              {pageData.map((c) => (
                <article
                  key={c.id}
                  className="bg-white p-4 rounded-2xl shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{c.name}</h3>
                      <div className="text-sm text-gray-600">
                        {c.industry} • {c.location}
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-medium">{c.employees} emp</div>
                      <div className="text-gray-500">Founded {c.founded}</div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* Pagination */}
        <footer className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-600 text-[0.5rem] sm:text-sm">
            Page {page} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="px-3 py-1 rounded-md sm:border disabled:opacity-40"
            >
              <span className="hidden sm:block">First</span>
              <FaStepBackward className="sm:hidden size-3" />
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 rounded-md sm:border disabled:opacity-40"
            >
              <span className="hidden sm:block">Prev</span>
              <FaBackward className="sm:hidden size-3" />
            </button>
            <div className="px-3 py-1 border rounded-md text-[0.5rem] sm:text-sm">
              {Math.min((page - 1) * pageSize + 1, total)} -{" "}
              {Math.min(page * pageSize, total)} of {total}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 rounded-md sm:border disabled:opacity-40"
            >
              <span className="hidden sm:block">Next</span>
              <FaForward className="sm:hidden size-3" />
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="px-3 py-1 rounded-md sm:border disabled:opacity-40"
            >
              <span className="hidden sm:block">Last</span>
              <FaStepForward className="sm:hidden size-3" />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

// ---------- Small UI components ----------
function CenteredLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-pulse text-xl">Loading companies...</div>
        <div className="text-sm text-gray-500 mt-2">
          If this hangs, check your network or backend.
        </div>
      </div>
    </div>
  );
}

function CenteredError({ message, onRetry }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl shadow text-center">
        <h2 className="text-lg font-semibold text-red-600">Error</h2>
        <p className="mt-2 text-sm text-gray-700">{message}</p>
        <div className="mt-4 flex justify-center gap-2">
          <button onClick={onRetry} className="px-4 py-2 rounded-md border">
            Reload
          </button>
        </div>
      </div>
    </div>
  );
}
