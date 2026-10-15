import { useEffect, useState } from "react";
import axiosInstance from "../axiosConfig";

const ClassMembersTable = ({ classId, token }) => {
  const [data, setData] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMembers = async () => {
      setLoading(true);
      setMessage("");
      try {
        const response = await axiosInstance.get(
          `/api/classes/${classId}/members`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setData(response.data);
      } catch (error) {
        setMessage(
          error.response?.data?.message || "Could not load the members list.",
        );
      } finally {
        setLoading(false);
      }
    };
    loadMembers();
  }, [classId, token]);

  if (loading) return <p className="text-sm text-slate-600">Loading members...</p>;
  if (message) return <p className="text-sm text-red-700">{message}</p>;
  if (!data.members.length)
    return <p className="text-sm text-slate-600">No members have booked this class yet.</p>;

  return (
    <div className="overflow-x-auto">
      <p className="text-sm text-slate-600 mb-2">
        {data.memberCount} member{data.memberCount === 1 ? "" : "s"} booked
      </p>
      <table className="w-full text-sm border">
        <thead className="bg-slate-100 text-left">
          <tr>
            <th className="p-2 border">#</th>
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Email</th>
          </tr>
        </thead>
        <tbody>
          {data.members.map((member, index) => (
            <tr key={member._id}>
              <td className="p-2 border">{index + 1}</td>
              <td className="p-2 border">{member.name}</td>
              <td className="p-2 border">{member.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ClassMembersTable;
