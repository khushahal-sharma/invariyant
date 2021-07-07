import React from "react";
import "./list.css";

const List = ({ selectMenu, selected }) => {
  return (
    <div className="list">
      <ol>
        <li className={selected === 'getPersonData' && "selected"} onClick={() => selectMenu("getPersonData")}>Get Person</li>
        <li className={selected === 'getEventId' && "selected"} onClick={() => selectMenu("getEventId")}>Get Event</li>
        <li className={selected === 'getVisitId' && "selected"} onClick={() => selectMenu("getVisitId")}>Get Visit Id</li>
      </ol>
    </div>
  );
};

export default List;
