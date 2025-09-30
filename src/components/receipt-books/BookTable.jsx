// src/components/receipt-books/BookTable.jsx
import React from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Tooltip
} from "@mui/material";

const CAP = 25; // max receipts per book

const BookTable = ({
  rows = [],
  isAdmin = false,
  isSanchalak = false,
  loading = false,
  ownerChip,
  formatRange,
  onAssign,
  onDeassign,
  onSubmitBook,
  onEdit,
  onDelete,
}) => {
  const showActions = isAdmin || isSanchalak;
  const emptyColSpan = showActions ? 5 : 4;
  console.log(rows);
  return (
    <TableContainer component={Paper} sx={{ maxHeight: 650 }}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>Book No</TableCell>
            <TableCell>Range</TableCell>
            <TableCell>Issued On</TableCell>
            <TableCell>Current Holder</TableCell>
            {showActions && <TableCell>Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {(rows || []).map((row, idx) => {
            const lastUsed = row?.last_used_no;           // treat end_no as "last receipt used"
            const isSubmitted =
              (typeof row?.status === "string" && row.status.toLowerCase() === "submitted") ||
              !!row?.submitted_at;

            const assigned  = !!(row?.issued_to_user_id || row?.issued_to_name);
            const fullyUsed = lastUsed >= CAP;                    // all receipts used
            const canAssign = !assigned && !isSubmitted && !fullyUsed && !!row?.book_no;
            console.log(assigned,isSubmitted,fullyUsed,row?.book_no,lastUsed);
            return (
              <TableRow key={row?.id || row?.book_no || idx} hover>
                <TableCell>{row?.book_no ?? "-"}</TableCell>
                <TableCell>{`${row?.last_used_no || row?.start_no } - ${`25`}`}</TableCell>
                <TableCell>
                  {row?.issued_on ? new Date(row.issued_on).toLocaleDateString() : "-"}
                </TableCell>
                <TableCell>{ownerChip(row)}</TableCell>

                {showActions && (
                  <TableCell>
                    {isAdmin ? (
                      // ADMIN: Edit / Delete only
                      <>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => onEdit?.(row)}
                          sx={{ mr: 1 }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => onDelete?.(row)}
                          disabled={loading}
                        >
                          Delete
                        </Button>
                        {canAssign ? (
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => onAssign?.(row?.book_no)}
                            disabled={loading}
                            sx={{ mr: 1 }}
                          >
                            Assign
                          </Button>
                        ) : (
                          <Tooltip
                            title={
                              isSubmitted
                                ? "Book already submitted"
                                : assigned
                                ? "Already assigned — deassign first"
                                : fullyUsed
                                ? `All ${CAP} receipts used — submit instead`
                                : !row?.book_no
                                ? "Missing book number"
                                : ""
                            }
                          >
                            <span>
                              <Button size="small" variant="contained" disabled sx={{ mr: 1 }}>
                                Assign
                              </Button>
                            </span>
                          </Tooltip>
                        )}

                        {/* If assigned (and not submitted), allow Deassign + Submit */}
                        {assigned && !isSubmitted && (
                          <>
                            <Button
                              size="small"
                              variant="outlined"
                              color="warning"
                              onClick={() => onDeassign?.(row?.book_no)}
                              disabled={loading}
                              sx={{ mr: 1 }}
                            >
                              Deassign
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="success"
                              onClick={() => onSubmitBook?.(row?.book_no)}
                              disabled={loading}
                            >
                              Submit
                            </Button>
                          </>
                        )}

                        {/* If NOT assigned but fully used (and not submitted), allow Submit */}
                        {!assigned && fullyUsed && !isSubmitted && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="success"
                            onClick={() => onSubmitBook?.(row?.book_no)}
                            disabled={loading}
                          >
                            Submit
                          </Button>
                        )}
                      </>
                    ) : (
                      // SANCHALAK actions
                      <>
                        {/* Assign is only when NOT assigned, NOT submitted, NOT fully used */}
                        {canAssign ? (
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => onAssign?.(row?.book_no)}
                            disabled={loading}
                            sx={{ mr: 1 }}
                          >
                            Assign
                          </Button>
                        ) : (
                          <Tooltip
                            title={
                              isSubmitted
                                ? "Book already submitted"
                                : assigned
                                ? "Already assigned — deassign first"
                                : fullyUsed
                                ? `All ${CAP} receipts used — submit instead`
                                : !row?.book_no
                                ? "Missing book number"
                                : ""
                            }
                          >
                            <span>
                              <Button size="small" variant="contained" disabled sx={{ mr: 1 }}>
                                Assign
                              </Button>
                            </span>
                          </Tooltip>
                        )}

                        {/* If assigned (and not submitted), allow Deassign + Submit */}
                        {assigned && !isSubmitted && (
                          <>
                            <Button
                              size="small"
                              variant="outlined"
                              color="warning"
                              onClick={() => onDeassign?.(row?.book_no)}
                              disabled={loading}
                              sx={{ mr: 1 }}
                            >
                              Deassign
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="success"
                              onClick={() => onSubmitBook?.(row?.book_no)}
                              disabled={loading}
                            >
                              Submit
                            </Button>
                          </>
                        )}

                        {/* If NOT assigned but fully used (and not submitted), allow Submit */}
                        {!assigned && fullyUsed && !isSubmitted && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="success"
                            onClick={() => onSubmitBook?.(row?.book_no)}
                            disabled={loading}
                          >
                            Submit
                          </Button>
                        )}
                      </>
                    )}
                  </TableCell>
                )}
              </TableRow>
            );
          })}

          {(rows?.length ?? 0) === 0 && (
            <TableRow>
              <TableCell colSpan={emptyColSpan} align="center" sx={{ py: 4, color: "text.secondary" }}>
                {loading ? "Loading books…" : "No books found"}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default BookTable;
