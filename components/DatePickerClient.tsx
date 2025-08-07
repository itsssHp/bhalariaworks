// components/DatePickerClient.tsx
"use client";

import dynamic from "next/dynamic";
import "react-datepicker/dist/react-datepicker.css";

// ✅ Dynamically import DatePicker without using `any`
const DatePicker = dynamic(
  () => import("react-datepicker").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => <p>Loading...</p>,
  }
);

export default DatePicker;
