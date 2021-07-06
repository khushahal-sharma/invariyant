import React, { useMemo, useState } from "react";
import "./table.css";
import List from "./List";
import Table from "./Table";

const Pagination = () => {

  const [ selected, setSelected ] = useState("getPersonData")

  const menuSelect = (value) =>{
      console.log(value);
      setSelected(value)
  }

  return (
    <div className="table-wrapper">
      <List selectMenu={menuSelect} selected={selected}/>
      <Table selectedMenu={selected} />
    </div>
  );
};

export default Pagination;
