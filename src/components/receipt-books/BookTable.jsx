// src/components/receipt-books/BookTable.jsx
import React from "react";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button } from "@mui/material";


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
  onEdit,       // NEW
  onDelete,     // NEW
}) => {
  return (
    <TableContainer component={Paper} sx={{ maxHeight: 650 }}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>Book No</TableCell>
            <TableCell>Range</TableCell>
            <TableCell>Issued On</TableCell>
            <TableCell>Current Holder</TableCell>
            {(isAdmin || isSanchalak) && <TableCell>Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {(rows || []).map((row, idx) => {
            const isSubmitted =
              (typeof row?.status === "string" && row.status.toLowerCase() === "submitted") ||
              !!row?.submitted_at;

            return (
              <TableRow key={row?.id || row?.book_no || idx} hover>
                <TableCell>{row?.book_no ?? "-"}</TableCell>
                <TableCell>{formatRange(row)}</TableCell>
                <TableCell>
                  {row?.issued_on ? new Date(row.issued_on).toLocaleDateString() : "-"}
                </TableCell>
                <TableCell>{ownerChip(row)}</TableCell>

                {(isAdmin || isSanchalak) && (
                  <TableCell>
                    {/* ADMIN: Edit/Delete */}
                    {isAdmin ? (
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
                      </>
                    ) : (
                      // SANCHALAK: Assign / Deassign / Submit
                      <>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => onAssign?.(row?.book_no)}
                          disabled={loading || !row?.book_no || isSubmitted}
                          sx={{ mr: 1 }}
                        >
                          Assign
                        </Button>
                        {(row?.issued_to_user_id || row?.issued_to_name) && !isSubmitted && (
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
                      </>
                    )}
                  </TableCell>
                )}
              </TableRow>
            );
          })}

          {(rows?.length ?? 0) === 0 && (
            <TableRow>
              <TableCell colSpan={5} align="center" sx={{ py: 4, color: "text.secondary" }}>
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
